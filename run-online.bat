@echo off
setlocal

cd /d "%~dp0"

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] pnpm is not installed or not in PATH.
  echo Install pnpm first, then run this file again.
  pause
  exit /b 1
)

set "CLOUDFLARED_CMD=cloudflared"
where cloudflared >nul 2>nul
if errorlevel 1 (
  if exist "%ProgramFiles%\cloudflared\cloudflared.exe" (
    set "CLOUDFLARED_CMD=%ProgramFiles%\cloudflared\cloudflared.exe"
  ) else if exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" (
    set "CLOUDFLARED_CMD=%ProgramFiles(x86)%\cloudflared\cloudflared.exe"
  ) else (
    echo [ERROR] cloudflared is not installed or not in PATH.
    echo Install it with:
    echo   winget install --id Cloudflare.cloudflared -e
    echo Then close/reopen terminal and run this file again.
    pause
    exit /b 1
  )
)

set MODE=%~1
if "%MODE%"=="" set MODE=dev

set APP_PORT=8080
if /I "%MODE%"=="prod" goto START_PROD
goto START_DEV

:START_DEV
set APP_PORT=8080
echo Starting BayanTrack in DEV mode on http://127.0.0.1:%APP_PORT%
start "BayanTrack App (dev)" cmd /k "cd /d ""%~dp0"" && pnpm dev"
goto START_TUNNEL

:START_PROD
if not exist "dist\server\node-build.mjs" (
  echo Production build not found. Building now...
  call pnpm build
  if errorlevel 1 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
  )
)
set APP_PORT=3000
echo Starting BayanTrack in PROD mode on http://127.0.0.1:%APP_PORT%
start "BayanTrack App (prod)" cmd /k "cd /d ""%~dp0"" && set PORT=%APP_PORT% && pnpm start"

:START_TUNNEL
echo Waiting for app server to be reachable on http://127.0.0.1:%APP_PORT% ...
set READY=
for /L %%i in (1,1,40) do (
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:%APP_PORT%' -TimeoutSec 1; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } else { exit 1 } } catch { if ($_.Exception.Response.StatusCode.value__ -ge 200 -and $_.Exception.Response.StatusCode.value__ -lt 500) { exit 0 } else { exit 1 } }" >nul 2>nul
  if not errorlevel 1 (
    set READY=1
    goto :START_TUNNEL_OK
  )
  timeout /t 1 >nul
)

:START_TUNNEL_OK
if not defined READY (
  echo [ERROR] App did not respond on http://127.0.0.1:%APP_PORT% within 40 seconds.
  echo Check the "BayanTrack App" window for startup errors, then run again.
  pause
  exit /b 1
)

echo App is reachable. Starting tunnel...
start "BayanTrack Tunnel" "%CLOUDFLARED_CMD%" tunnel --url http://127.0.0.1:%APP_PORT%

echo.
echo Started.
echo 1) Keep both opened windows running.
echo 2) Copy the https://*.trycloudflare.com URL from the tunnel window.
echo 3) Share that URL to access your site from other devices.
echo.
pause
