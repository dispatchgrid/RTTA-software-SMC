cd /d "C:\RTTA-SERVER"
start "" npm start
timeout /t 5
start "" "http://localhost:3000"
pause
