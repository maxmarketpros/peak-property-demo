@echo off
REM Peak Property Electric - local preview launcher
REM Double-click this file to view the site in your browser.

cd /d "%~dp0"
echo Starting Peak Property Electric site at http://localhost:8000 ...
echo Close this window (or press Ctrl+C) to stop the server.
start "" "http://localhost:8000/"
node build\serve.mjs 8000
