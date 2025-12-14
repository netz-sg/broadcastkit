import { configStore } from '../store';

export interface RawgGameInfo {
  id: number;
  name: string;
  slug: string;
  background_image: string | null;
  released: string | null;
  rating: number;
  genres: { id: number; name: string }[];
  platforms: { platform: { id: number; name: string } }[];
  developers: { id: number; name: string }[];
  publishers: { id: number; name: string }[];
  description_raw?: string;
}

export interface RawgSearchResult {
  count: number;
  results: RawgGameInfo[];
}

const RAWG_BASE_URL = 'https://api.rawg.io/api';

export async function searchGame(gameName: string): Promise<RawgGameInfo | null> {
  const apiKey = configStore.getRawgConfig().apiKey;
  
  if (!apiKey) {
    console.warn('[RAWG] No API key configured');
    return null;
  }

  try {
    // Clean up game name for better search results
    let cleanName = gameName
      .replace(/[™®©]/g, '')
      .replace(/\s*\(.*\)/g, '')
      .trim();
    
    // If the search includes "Special Edition" etc., also try without it
    const searchVariants = [cleanName];
    
    // Add variant without edition suffix for better matching
    const withoutEdition = cleanName
      .replace(/\s*(Special|Anniversary|Definitive|Enhanced|Game of the Year)\s*Edition/gi, '')
      .replace(/\s*GOTY/gi, '')
      .replace(/\s*(HD|VR|Remastered|Remake)$/gi, '')
      .trim();
    
    if (withoutEdition !== cleanName && withoutEdition.length > 2) {
      searchVariants.push(withoutEdition);
    }

    console.log(`[RAWG] Searching for: "${cleanName}" (variants: ${searchVariants.join(', ')})`);

    for (const searchTerm of searchVariants) {
      const searchUrl = `${RAWG_BASE_URL}/games?key=${apiKey}&search=${encodeURIComponent(searchTerm)}&page_size=10&search_precise=true`;
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        console.error(`[RAWG] API error: ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json() as RawgSearchResult;
      
      if (data.results && data.results.length > 0) {
        // Try to find exact match first
        const lowerSearch = searchTerm.toLowerCase();
        const exactMatch = data.results.find(
          (game) => game.name.toLowerCase() === lowerSearch ||
                    game.name.toLowerCase().includes(lowerSearch) ||
                    lowerSearch.includes(game.name.toLowerCase())
        );
        
        // Also check if the original search term matches
        const originalMatch = data.results.find(
          (game) => game.name.toLowerCase().includes(cleanName.toLowerCase().split(' ')[0])
        );
        
        const bestMatch = exactMatch || originalMatch || data.results[0];
        
        // Verify it's actually a close match (not something random like "SkyTime" for "Skyrim")
        const matchScore = calculateMatchScore(searchTerm, bestMatch.name);
        console.log(`[RAWG] Found: "${bestMatch.name}" (score: ${matchScore})`);
        
        if (matchScore >= 0.3) {
          return bestMatch;
        }
      }
    }

    console.log('[RAWG] No good results found');
    return null;
  } catch (error) {
    console.error('[RAWG] Error searching game:', error);
    return null;
  }
}

/**
 * Calculate how well two game names match (0 to 1)
 */
function calculateMatchScore(search: string, result: string): number {
  const s = search.toLowerCase().replace(/[^a-z0-9]/g, '');
  const r = result.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Exact match
  if (s === r) return 1;
  
  // One contains the other
  if (r.includes(s) || s.includes(r)) return 0.8;
  
  // Check if main word matches
  const searchWords = search.toLowerCase().split(/\s+/);
  const resultWords = result.toLowerCase().split(/\s+/);
  
  const mainWordMatch = searchWords.some(sw => 
    resultWords.some(rw => sw.length > 3 && rw.length > 3 && (sw.includes(rw) || rw.includes(sw)))
  );
  
  if (mainWordMatch) return 0.5;
  
  // Calculate character overlap
  let matches = 0;
  for (const char of s) {
    if (r.includes(char)) matches++;
  }
  
  return matches / Math.max(s.length, r.length);
}

export async function getGameById(gameId: number): Promise<RawgGameInfo | null> {
  const apiKey = configStore.getRawgConfig().apiKey;
  
  if (!apiKey) {
    console.warn('[RAWG] No API key configured');
    return null;
  }

  try {
    const url = `${RAWG_BASE_URL}/games/${gameId}?key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[RAWG] API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json() as RawgGameInfo;
  } catch (error) {
    console.error('[RAWG] Error getting game details:', error);
    return null;
  }
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const url = `${RAWG_BASE_URL}/games?key=${apiKey}&page_size=1`;
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    console.error('[RAWG] Error validating API key:', error);
    return false;
  }
}
