@echo off
echo Killing any process on port 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    echo Killing PID %%a
    taskkill /PID %%a /F 2>nul
)
echo Done. Port 8080 is now free.
echo Starting Spring Boot backend...
call mvnw spring-boot:run
