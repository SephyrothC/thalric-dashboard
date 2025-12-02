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

# Get script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Check if node_modules exists
if [ ! -d "$PROJECT_ROOT/server/node_modules" ] || [ ! -d "$PROJECT_ROOT/client/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"

    # Install server dependencies
    echo "Installing server dependencies..."
    cd "$PROJECT_ROOT/server" && npm install

    # Install client dependencies
    echo "Installing client dependencies..."
    cd "$PROJECT_ROOT/client" && npm install

    echo -e "${GREEN}✅ Dependencies installed!${NC}"
    echo ""
fi

# Build client
echo -e "${YELLOW}🔨 Building frontend...${NC}"
cd "$PROJECT_ROOT/client" && npm run build
echo -e "${GREEN}✅ Frontend built!${NC}"
echo ""

# Start server
echo -e "${GREEN}🚀 Starting server...${NC}"
echo ""

# Get local IP address (Windows host IP, not WSL)
# Try to get Windows host IP via /etc/resolv.conf (WSL2) or powershell
if grep -q microsoft /proc/version 2>/dev/null; then
    # We're in WSL - get Windows host IP
    LOCAL_IP=$(powershell.exe -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \$_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL' -and \$_.PrefixOrigin -eq 'Dhcp' } | Select-Object -First 1).IPAddress" 2>/dev/null | tr -d '\r')
    
    # Fallback: try getting from ipconfig
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP=$(powershell.exe -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \$_.InterfaceAlias -match 'Wi-Fi|Ethernet' } | Select-Object -First 1).IPAddress" 2>/dev/null | tr -d '\r')
    fi
else
    # Not in WSL - use standard Linux method
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

# Final fallback
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="<your-windows-ip>"
fi

echo "Dashboard will be available at:"
echo "  🖥️  Main Dashboard: http://localhost:3000"
echo "  📱 Tablet Viewer:   http://localhost:3000/viewer"
echo ""
echo "To access from tablet on same network:"
echo -e "  📱 ${GREEN}http://${LOCAL_IP}:3000/viewer${NC}"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$PROJECT_ROOT/server" && npm start
