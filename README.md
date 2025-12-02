# 🎲 Thalric Dashboard v2.0

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2-61dafb.svg)

**A modern, real-time D&D 5e Character Management Dashboard** built specifically for *Thalric Cœur d'Argent* (Aasimar Paladin Level 14).

This application serves as a digital character sheet and combat companion, featuring a dedicated **Tablet Viewer** for real-time dice rolls and status updates, synchronized instantly via WebSockets.

---

## ✨ Key Features

### ⚔️ Advanced Combat System
- **Smart Dice Rolling**: Integrated 3D-like dice logic with automatic modifiers.
- **Divine Smite Calculator**: Dedicated interface to expend spell slots for Smite, including "Undead/Fiend" bonuses and Critical Hit doubling.
- **Channel Divinity**: Track and activate *Sacred Weapon* or *Turn the Unholy* with automatic condition tracking.
- **Active Conditions**: Automations for *Bless*, *Bane*, *Shield of Faith*, and *Haste* that dynamically update AC and Saving Throws.
- **Custom Critical Rules**: Implements the house rule: `(Normal Roll) + (Max Die Value)` for massive critical damage.

### 🧙‍♂️ Spellcasting & Abilities
- **Visual Spell Slots**: Interactive tracker for spell slots (Levels 1-5).
- **One-Click Casting**: Automatically consumes slots and applies relevant conditions.
- **Feature Tracking**: Manage pools for *Lay on Hands*, *Cleansing Touch*, and *Radiant Soul*.

### 🔄 Resource Management
- **Rest System**: 
  - **Short Rest**: Spend Hit Dice and recover Channel Divinity/Warlock slots.
  - **Long Rest**: Full reset of HP, Spell Slots, and Long Rest abilities.
- **HP & Vitals**: Real-time HP bar with temporary HP support.

### 📱 Tablet Companion App
- **Real-Time Sync**: <500ms latency using Socket.IO.
- **Visual Feedback**: Critical hits glow gold, fumbles shake red.
- **Read-Only Mode**: Perfect for a second screen or for the DM to monitor status.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Zustand (State Management)
- **Backend**: Node.js, Express, Socket.IO
- **Database**: SQLite3 (Robust, file-based storage)
- **Architecture**: Client-Server model with WebSocket synchronization

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** installed on your machine. [Download Here](https://nodejs.org)
- A modern web browser (Chrome, Edge, Firefox, Safari).

### 📥 Installation & Launch

We provide automated scripts for a zero-configuration start.

#### 🪟 Windows
1. Navigate to the `scripts` folder.
2. Double-click **`start.bat`**.
3. The script will:
   - Install all dependencies (first run only).
   - Build the React frontend.
   - Start the backend server.
   - Launch your default browser to the dashboard.

#### 🐧 Linux / 🍎 macOS
1. Open your terminal.
2. Run the start script:
   ```bash
   cd scripts
   chmod +x start.sh
   ./start.sh
   ```

#### ⚙️ Manual Installation (Dev Mode)
If you prefer to run the client and server separately for development:

**Terminal 1 (Server):**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 (Client):**
```bash
cd client
npm install
npm run dev
```

---

## 📖 Usage Guide

### 1. The Dashboard (PC)
Access at: `http://localhost:3000`

- **Combat Tab**: 
  - Click **Attack** on a weapon to roll to hit.
  - Click **Dmg** for standard damage.
  - Click **✨** to open the **Divine Smite** menu.
  - Use **Channel Divinity** to toggle *Sacred Weapon* (adds +5 to attacks automatically).
- **Spells Tab**: View prepared spells and click "Cast" to use slots.
- **Features Tab**: Activate racial and class abilities.
- **Rest**: Use the ☕ (Short) or ⛺ (Long) buttons in the header to recover resources.

### 2. The Tablet Viewer
Access at: `http://<YOUR_PC_IP>:3000/viewer`

1. Find your PC's local IP address:
   - Windows: Run `ipconfig` in terminal.
   - Mac/Linux: Run `ifconfig` or `ip a`.
2. Enter the URL on your tablet's browser.
3. The viewer will automatically stay in sync with the main dashboard.

---

## 🎲 Custom Rules Implementation

This dashboard is tailored with specific house rules:

- **Critical Hits**: Damage is calculated as `Roll + Max Possible Damage`.
  - *Example*: A 1d8+5 crit becomes `(1d8+5) + (8)`.
- **Active Conditions**:
  - **Shield of Faith**: Automatically adds +2 AC.
  - **Bless**: Automatically adds +1d4 to Attack Rolls and Saving Throws.
  - **Sacred Weapon**: Automatically adds +5 to Attack Rolls.

---

## 🤝 Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
