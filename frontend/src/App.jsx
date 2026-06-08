import { useState } from 'react'
import PortKiller from './components/PortKiller'
import DockerManager from './components/DockerManager'
import SystemMonitor from './components/SystemMonitor'
import NetworkMonitor from './components/NetworkMonitor'
import ProcessKiller from './components/ProcessKiller'

function App() {
  return (
    <div className="container">
      <header>
        <h1>HostKill</h1>
        <div className="subtitle">LOCAL_SYSTEM_COMMAND_CENTER // STATUS: ONLINE</div>
      </header>

      <SystemMonitor />
      <NetworkMonitor />

      <main className="dashboard-grid">
        <ProcessKiller />
        <PortKiller />
        <DockerManager />
      </main>
    </div>
  )
}

export default App
