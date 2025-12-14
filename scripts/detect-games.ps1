Get-Process -ErrorAction SilentlyContinue | 
    Where-Object { $_.MainWindowHandle -ne 0 } | 
    Select-Object -ExpandProperty ProcessName | 
    Sort-Object -Unique
