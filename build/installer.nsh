; Custom NSIS Installer Script for BroadcastKit
; Beta Warning and Custom Uninstall

!macro customInit
  ; Show beta warning on start
  MessageBox MB_ICONINFORMATION|MB_OK "BETA VERSION$\r$\n$\r$\nBroadcastKit befindet sich in der Beta-Phase.$\r$\nBei Problemen oder Feedback wende dich an den Entwickler."
!macroend

!macro customUnInstall
  ; Clean up config on uninstall (optional)
  MessageBox MB_YESNO "Moechtest du auch die Einstellungen loeschen?" IDNO skipDelete
    RMDir /r "$APPDATA\broadcastkit"
  skipDelete:
!macroend
