@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  Wallie_911_Pro — Springbok SOS-kamp
echo  ---------------------------------
echo  Begin die afrigter-cockpit op JOU rekenaar...
echo.
where node >nul 2>&1
if errorlevel 1 (
  echo  Node.js is nie geinstalleer nie — geen probleem.
  echo  Ons maak die LIVE weergawe oop ^(kamera werk op HTTPS^):
  echo  https://pamoja-academy.github.io/Wallie_911_Pro/
  echo.
  start "" "https://pamoja-academy.github.io/Wallie_911_Pro/"
  echo  Merk waarneming-toestemming → Missie → Begin.
  echo  Pa-PIN: 9110
  pause
  exit /b 0
)
echo  Oop http://localhost:9110 in jou browser...
start "" "http://localhost:9110"
npx --yes serve -p 9110
pause
