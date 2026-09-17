@echo off
setlocal
set "TARGET=%~dp0dist\index.html"
if not exist "%TARGET%" (
  echo dist\index.html was not found. Run build-standalone.bat first.
  pause
  exit /b 1
)
start "" "%TARGET%"
endlocal
