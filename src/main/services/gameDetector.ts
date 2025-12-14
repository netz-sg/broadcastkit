import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Minimal Blacklist - only processes that are 100% NEVER games
// Everything else gets checked against RAWG API
const BLACKLIST = new Set([
  // Windows Core
  'explorer', 'dwm', 'csrss', 'lsass', 'services', 'smss', 'wininit', 'winlogon',
  'svchost', 'taskhost', 'taskhostw', 'sihost', 'ctfmon', 'conhost', 'dllhost',
  'searchhost', 'runtimebroker', 'applicationframehost', 'systemsettings',
  'textinputhost', 'shellexperiencehost', 'startmenuexperiencehost', 'searchui',
  'lockapp', 'fontdrvhost', 'spoolsv', 'taskmgr', 'mmc', 'regedit',
  'windowsterminal', 'powershell', 'cmd', 'pwsh', 'wt',
  
  // Browsers
  'chrome', 'firefox', 'msedge', 'opera', 'brave', 'vivaldi', 'chromium',
  
  // Communication
  'discord', 'slack', 'teams', 'zoom', 'skype',
  
  // Dev Tools
  'code', 'devenv', 'node', 'electron',
  
  // Game Launchers (NOT games!)
  'steam', 'steamwebhelper', 'epicgameslauncher', 'eadesktop', 'origin',
  'gog galaxy', 'galaxyclient', 'upc', 'battle.net', 'playnite',
  
  // Media & Streaming
  'spotify', 'obs64', 'obs32', 'streamlabs', 'xsplit', 'picard',
  
  // Misc utilities that are never games
  'adobe desktop service', 'afterburner', 'vortex', 'modorganizer',
]);

export interface DetectedGame {
  processName: string;
  gameName: string;
  windowTitle: string;
}

export interface GameCandidate {
  processName: string;
  searchName: string;
}

/**
 * Get all running processes with visible windows, excluding known non-games.
 * Returns process names that should be checked against RAWG API.
 */
export async function getGameCandidates(): Promise<string[]> {
  try {
    console.log('[GameDetector] Getting game candidates...');
    
    // PowerShell command to get processes with windows
    const psScript = 'Get-Process -EA SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -ExpandProperty ProcessName | Sort-Object -Unique';
    const encodedCommand = Buffer.from(psScript, 'utf16le').toString('base64');
    const command = `powershell -NoProfile -EncodedCommand ${encodedCommand}`;
    
    const { stdout } = await execAsync(command, { windowsHide: true, timeout: 10000 });

    if (!stdout || stdout.trim() === '') {
      return [];
    }

    const processNames = stdout.trim().split(/\r?\n/).filter(Boolean);
    console.log(`[GameDetector] Raw processes: ${processNames.join(', ')}`);
    
    // Filter out blacklisted processes
    const candidates = processNames.filter(procName => {
      const lowerName = procName.toLowerCase();
      
      // Check exact match in blacklist
      if (BLACKLIST.has(lowerName)) {
        console.log(`[GameDetector] Blocked (exact): ${procName}`);
        return false;
      }
      
      // Check if process name contains a blacklisted word
      for (const blocked of BLACKLIST) {
        if (lowerName.includes(blocked)) {
          console.log(`[GameDetector] Blocked (contains ${blocked}): ${procName}`);
          return false;
        }
      }
      
      // No length check - let RAWG decide! Games like "bf6", "cs2", "gta", "cod" are valid
      
      // Skip only obvious non-game patterns (very minimal)
      const skipPatterns = ['setup', 'install', 'uninstall', 'updater', 'crashhandler'];
      
      for (const pattern of skipPatterns) {
        if (lowerName.includes(pattern)) {
          console.log(`[GameDetector] Blocked (pattern ${pattern}): ${procName}`);
          return false;
        }
      }
      
      console.log(`[GameDetector] Candidate accepted: ${procName}`);
      return true;
    });

    console.log(`[GameDetector] Found ${candidates.length} game candidates:`, candidates);
    return candidates;
  } catch (error) {
    console.error('[GameDetector] Error getting candidates:', error);
    return [];
  }
}

/**
 * Clean up a process name to make it more searchable on RAWG
 */
export function cleanProcessName(processName: string): string {
  const lowerName = processName.toLowerCase();
  
  // Known abbreviations that RAWG won't find - expand them
  const knownAbbreviations: Record<string, string> = {
    'bf6': 'Battlefield 6',
    'bf2042': 'Battlefield 2042',
    'bf5': 'Battlefield V',
    'bf4': 'Battlefield 4',
    'bf3': 'Battlefield 3',
    'bf1': 'Battlefield 1',
    'cod': 'Call of Duty',
    'mw2': 'Modern Warfare 2',
    'mw3': 'Modern Warfare 3',
    'bo6': 'Black Ops 6',
    'cs2': 'Counter-Strike 2',
    'csgo': 'Counter-Strike Global Offensive',
    'gta5': 'Grand Theft Auto V',
    'gtav': 'Grand Theft Auto V',
    'gta6': 'Grand Theft Auto VI',
    'rdr2': 'Red Dead Redemption 2',
    'hll': 'Hell Let Loose',
    'lol': 'League of Legends',
    'wow': 'World of Warcraft',
    'ffxiv': 'Final Fantasy XIV',
    'ffxvi': 'Final Fantasy XVI',
    'bg3': 'Baldurs Gate 3',
    'poe': 'Path of Exile',
    'poe2': 'Path of Exile 2',
    'd4': 'Diablo IV',
    'dbd': 'Dead by Daylight',
    'r6': 'Rainbow Six Siege',
    'eft': 'Escape from Tarkov',
    'tarkov': 'Escape from Tarkov',
    'pubg': 'PUBG Battlegrounds',
    'ow2': 'Overwatch 2',
    'hd2': 'Helldivers 2',
    'rl': 'Rocket League',
    'fc24': 'EA Sports FC 24',
    'fc25': 'EA Sports FC 25',
    'nba2k24': 'NBA 2K24',
    'nba2k25': 'NBA 2K25',
  };
  
  // Check if it's a known abbreviation
  if (knownAbbreviations[lowerName]) {
    return knownAbbreviations[lowerName];
  }
  
  let name = processName
    // Remove common technical suffixes
    .replace(/-?win64-?/gi, ' ')
    .replace(/-?win32-?/gi, ' ')
    .replace(/-?shipping-?/gi, ' ')
    .replace(/-?x64-?/gi, ' ')
    .replace(/-?x86-?/gi, ' ')
    .replace(/_x64/gi, '')
    .replace(/_x86/gi, '')
    .replace(/64$/gi, '')
    .replace(/32$/gi, '')
    // Remove version numbers
    .replace(/[_-]?v?\d+(\.\d+)*$/gi, '')
    // Replace separators with spaces
    .replace(/[-_\.]/g, ' ')
    // Clean up
    .replace(/\s+/g, ' ')
    .trim();
  
  // Handle common game edition suffixes (keep them readable for RAWG)
  // SkyrimSE -> Skyrim Special Edition
  // GameGOTY -> Game GOTY
  name = name
    .replace(/SE$/i, ' Special Edition')
    .replace(/GOTY$/i, ' Game of the Year')
    .replace(/AE$/i, ' Anniversary Edition')
    .replace(/DE$/i, ' Definitive Edition')
    .replace(/EE$/i, ' Enhanced Edition')
    .replace(/VR$/i, ' VR')
    .replace(/HD$/i, ' HD')
    .replace(/Remastered$/i, ' Remastered')
    .replace(/Remake$/i, ' Remake')
    .replace(/\s+/g, ' ')
    .trim();
  
  return name;
}

/**
 * Get all game candidates with cleaned names for RAWG lookup
 */
export async function getAllGameCandidates(): Promise<GameCandidate[]> {
  const candidates = await getGameCandidates();
  
  return candidates.map(proc => ({
    processName: proc,
    searchName: cleanProcessName(proc),
  }));
}

/**
 * Legacy function - returns first candidate
 * Real detection happens via RAWG in the IPC handler
 */
export async function detectRunningGame(): Promise<DetectedGame | null> {
  const candidates = await getGameCandidates();
  
  if (candidates.length === 0) {
    return null;
  }
  
  const firstCandidate = candidates[0];
  const cleanName = cleanProcessName(firstCandidate);
  
  return {
    processName: firstCandidate,
    gameName: cleanName,
    windowTitle: cleanName,
  };
}
