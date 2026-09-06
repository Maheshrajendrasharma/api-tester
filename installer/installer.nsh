!macro customInit

  ; Check whether an older API Tester installation exists
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\API Tester" "UninstallString"

  ; No older installation found
  StrCmp $0 "" done

  ; Older installation found
  MessageBox MB_OK|MB_ICONEXCLAMATION \
    "An older version of API Tester is already installed.$\r$\n$\r$\nPlease uninstall the older version before installing this version."

  ; Open Windows Apps & Features
  ExecShell "open" "ms-settings:appsfeatures"

  ; Stop the new installation
  Abort

done:

!macroend