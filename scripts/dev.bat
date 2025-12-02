@echo off
echo 🚀 Starting Thalric Dashboard in Development Mode...

echo 📦 Starting Backend (Nodemon)...
cd server
start "Thalric Server (Dev)" npm run dev
cd ..

timeout /t 2 /nobreak >nul

echo 💻 Starting Frontend (Vite)...
cd client
start "Thalric Client (Dev)" npm run dev
cd ..

echo ✨ Services started in separate windows.
echo Close the windows to stop the services.
