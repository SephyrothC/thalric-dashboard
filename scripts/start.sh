#!/usr/bin/env bash

echo "🎲 =================================="
echo "   Thalric Dashboard v2.0"
echo "   Starting application..."
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "../server/node_modules" ] || [ ! -d "../client/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"

    # Install server dependencies
    echo "Installing server dependencies..."
    cd ../server && npm install

    # Install client dependencies
    echo "Installing client dependencies..."
    cd ../client && npm install

    cd ../scripts
    echo -e "${GREEN}✅ Dependencies installed!${NC}"
    echo ""
fi

# Build client
echo -e "${YELLOW}🔨 Building frontend...${NC}"
cd ../client && npm run build
echo -e "${GREEN}✅ Frontend built!${NC}"
echo ""

# Start server
echo -e "${GREEN}🚀 Starting server...${NC}"
echo ""
echo "Dashboard will be available at:"
echo "  🖥️  Main Dashboard: http://localhost:3000"
echo "  📱 Tablet Viewer:   http://localhost:3000/viewer"
echo ""
echo "To access from tablet on same network:"
echo "  Find your local IP with: ipconfig (Windows) or ifconfig (Mac/Linux)"
echo "  Then access: http://YOUR_LOCAL_IP:3000/viewer"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd ../server && npm start
