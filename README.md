<div align="center">
  <h1 align="center">HOSTKILL</h1>
  <p align="center">
    <strong>The "God-Mode" Local System Command Center</strong>
  </p>
</div>

<p align="center">
  HostKill is a powerful, locally-hosted developer dashboard wrapped in a sleek, retro-cyberpunk aesthetic. It acts as your central command station, giving you absolute, cross-platform control over your machine's background processes, network traffic, hardware resources, and Docker containers directly from the browser.
</p>

---

## ✨ Features

- 💀 **Smart Process & Port Killer**
  - Instantly identify what processes are running on your machine and which ports they are blocking.
  - Safely terminate rogue processes with a built-in two-step `SURE? / CANCEL` lock.
  - *Safety First:* Automatically protects critical OS background services and the HostKill server itself from being accidentally killed.

- 🐳 **Docker Container Manager**
  - No more typing `docker ps`. View all your local Docker containers in real-time.
  - Start and stop containers with a single click.

- 📊 **Live Hardware & System Monitor**
  - Real-time animated progress bars streaming your **CPU Load**, **RAM Usage**, and **GPU VRAM**.
  - Automatically detects your specific CPU architecture, OS Version, and Graphics Card model.

- 📡 **Network Bandwidth Tracker**
  - High-precision polling monitors your machine's live `DOWNLOAD_RX` and `UPLOAD_TX` data transfer speeds natively from the OS level.

- 🌐 **100% Cross-Platform**
  - Powered by the native Node.js `systeminformation` engine.
  - Works identically out-of-the-box on **Windows**, **macOS**, and **Linux** without relying on fragile bash scripts.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Vanilla CSS (Cyberpunk UI System)
- **Backend**: Node.js, Express.js
- **System Engine**: `systeminformation` (for OS-agnostic hardware polling)
- **Containerization**: Native Docker CLI integration

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Docker](https://www.docker.com/) (Optional, but required if you want to use the Docker Manager panel)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/HostKill.git
   cd HostKill
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running the Command Center

HostKill includes a unified, cross-platform startup script. You do not need to manage multiple terminal windows. 

Simply open a terminal at the root of the project and run:
```bash
node start.js
```

This will simultaneously boot up the Node backend and the Vite frontend, stream all logs into a single colored terminal window, and make your Command Center accessible at `http://localhost:5173`.

---

## 🔒 Security & Privacy
HostKill is designed to be a **local-first** application. 
- It **does not** track telemetry.
- It **does not** send your hardware, process, or network data to any external servers.
- The Node.js backend executes high-privilege operations (like killing processes) natively on your local machine, and should therefore **never** be exposed to the public internet without proper authentication middleware.

---

<div align="center">
  <p><i>Initialize Sensors. Identify Targets. Execute.</i></p>
</div>
