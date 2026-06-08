import { useState } from 'react'
import PortKiller from './components/PortKiller'
import DockerManager from './components/DockerManager'
import SystemMonitor from './components/SystemMonitor'
import NetworkMonitor from './components/NetworkMonitor'
import ProcessKiller from './components/ProcessKiller'
import TerminalEmulator from './components/TerminalEmulator'

function App() {
  const [activeTab, setActiveTab] = useState('PORTS');

  return (
    <div className="container">
      <header>
        <h1>HostKill</h1>
        <div className="subtitle">LOCAL_SYSTEM_COMMAND_CENTER // STATUS: ONLINE</div>
      </header>

      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <SystemMonitor />
        <NetworkMonitor />
      </div>

      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'PORTS' ? 'active' : ''}`}
          onClick={() => setActiveTab('PORTS')}
        >
          [PORTS]
        </button>
        <button 
          className={`nav-tab ${activeTab === 'PROCESSES' ? 'active' : ''}`}
          onClick={() => setActiveTab('PROCESSES')}
        >
          [PROCESSES]
        </button>
        <button 
          className={`nav-tab ${activeTab === 'CONTAINERS' ? 'active' : ''}`}
          onClick={() => setActiveTab('CONTAINERS')}
        >
          [CONTAINERS]
        </button>
        <button 
          className={`nav-tab ${activeTab === 'TERMINAL' ? 'active' : ''}`}
          onClick={() => setActiveTab('TERMINAL')}
        >
          [TERMINAL]
        </button>
      </div>

      <main className="dashboard-grid">
        {activeTab === 'PORTS' && <PortKiller />}
        
        {activeTab === 'PROCESSES' && <ProcessKiller />}
        
        {activeTab === 'CONTAINERS' && <DockerManager />}

        {activeTab === 'TERMINAL' && <TerminalEmulator />}
      </main>

      <footer style={{ textAlign: 'center', marginTop: '3rem', color: '#888', fontSize: '0.9rem', borderTop: '1px solid rgba(0, 255, 255, 0.2)', paddingTop: '1rem' }}>
        <p>DEVELOPED_BY: JSK // SYSTEM_ONLINE</p>
      </footer>
    </div>
  )
}

export default App
