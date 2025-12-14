; Custom NSIS Installer Script for BroadcastKit
; ${VERSION} is automatically injected from package.json by electron-builder

!include "MUI2.nsh"

; Custom Welcome Page Title with Version
!macro customHeader
  !define MUI_WELCOMEPAGE_TITLE "Willkommen bei BroadcastKit v${VERSION}"
  !define MUI_WELCOMEPAGE_TEXT "BroadcastKit v${VERSION} wird auf deinem Computer installiert.$\r$\n$\r$\nProfessionelle Stream Overlays fuer OBS Studio - alles lokal auf deinem PC.$\r$\n$\r$\nKlicke auf Weiter um fortzufahren."
!macroend

; Show Features after Welcome Page
!macro customInit
  ; Feature MessageBox appears before license
  MessageBox MB_OK "BROADCASTKIT v${VERSION} - FEATURES$\r$\n$\r$\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$\r$\n$\r$\n[+] LOWER THIRD OVERLAYS$\r$\n     3 Premium Styles: Clean Pro, Broadcast, Esports$\r$\n     Mit Avatar-Support und Animationen$\r$\n$\r$\n[+] NOW PLAYING WIDGET$\r$\n     Automatische Spielerkennung + RAWG API$\r$\n     2 Styles: 3D Card, Cinematic Fullwidth$\r$\n$\r$\n[+] SOCIAL MEDIA WIDGET$\r$\n     Rotierende Social Cards (6 Plattformen)$\r$\n     Auto-Rotation mit konfigurierbarem Intervall$\r$\n$\r$\n[+] STREAM SCENES$\r$\n     Starting Soon, BRB, Ending, Tech Difficulties$\r$\n     Vollbild-Overlays mit Animationen$\r$\n$\r$\n[+] OBS WEBSOCKET INTEGRATION$\r$\n     Auto-Connect und Browser Source Refresh$\r$\n$\r$\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
!macroend

; Uninstall cleanup
!macro customUnInstall
  MessageBox MB_YESNO "Moechtest du auch alle Einstellungen loeschen?$\r$\n$\r$\n(Overlay-Konfigurationen, API-Keys, etc.)" IDNO skipDelete
    RMDir /r "$APPDATA\broadcastkit"
  skipDelete:
!macroend
