@echo off
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Requesting administrator permission to add the game-server firewall rule...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
netsh advfirewall firewall add rule name="Velvet North Blackjack 8787" dir=in action=allow protocol=TCP localport=8787
if %errorlevel% equ 0 (
  echo Windows Firewall now allows the game server on TCP port 8787.
) else (
  echo Could not add the firewall rule.
)
pause
