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
  echo  [Fout] Node.js is nie geinstalleer nie.
  echo  Vra Pa om Node te installeer, OF oop net index.html in Chrome.
  pause
  start "" "%~dp0index.html"
  exit /b 1
)
echo  Oop http://localhost:9110 in jou browser...
start "" "http://localhost:9110"
npx --yes serve -p 9110
pause
