#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Thalric Dashboard in Development Mode...${NC}"

# Function to handle kill
cleanup() {
    echo -e "\n${BLUE}🛑 Shutting down services...${NC}"
    # Kill all child processes in the same process group
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Start Server
echo -e "${GREEN}📦 Starting Backend (Nodemon)...${NC}"
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Wait a moment for server to initialize
sleep 2

# Start Client
echo -e "${GREEN}💻 Starting Frontend (Vite)...${NC}"
cd client
npm run dev &
CLIENT_PID=$!
cd ..

echo -e "${BLUE}✨ Both services are running! Press Ctrl+C to stop.${NC}"

# Wait for processes
wait
