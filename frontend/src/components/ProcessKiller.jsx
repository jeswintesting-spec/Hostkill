import { useState, useEffect } from 'react';

function ProcessKiller() {
  const [processes, setProcesses] = useState([]);
  const [error, setError] = useState(null);
  const [killingPid, setKillingPid] = useState(null);

  const fetchProcesses = async () => {
    try {
      const res = await fetch('/api/processes');
      if (!res.ok) throw new Error('Failed to fetch processes');
      const data = await res.json();
      setProcesses(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleKill = async (pid) => {
    try {
      const res = await fetch('/api/ports/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid })
      });
      if (!res.ok) throw new Error('Failed to kill process');
      setKillingPid(null);
      fetchProcesses();
    } catch (err) {
      alert(err.message);
      setKillingPid(null);
    }
  };

  if (error) {
    return (
      <div className="panel">
        <h2>[TOP_PROCESSES]</h2>
        <div style={{ color: 'var(--neon-pink)' }}>ERROR: {error}</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>[TOP_PROCESSES]</h2>
        <button className="icon-btn" onClick={fetchProcesses}>↻</button>
      </div>
      
      {processes.length === 0 ? (
        <div style={{ color: '#888' }}>SCANNING_PROCESSES...</div>
      ) : (
        <ul className="port-list">
          {processes.map(proc => (
            <li key={proc.pid} className="port-item">
              <div className="port-info">
                <span className="port-number">{proc.command}</span>
                <div className="port-meta">
                  <span>PID:{proc.pid}</span>
                  <span>USR:{proc.user}</span>
                  <span style={{ color: 'var(--neon-cyan)' }}>CPU:{proc.cpu}%</span>
                  <span style={{ color: 'var(--neon-green)' }}>RAM:{proc.mem}%</span>
                </div>
              </div>
              
              <div className="port-actions">
                {proc.killable ? (
                  killingPid === proc.pid ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleKill(proc.pid)}
                      >
                        SURE?
                      </button>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => setKillingPid(null)}
                      >
                        CANCEL
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-danger" 
                      onClick={() => setKillingPid(proc.pid)}
                    >
                      KILL
                    </button>
                  )
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span className="badge badge-warning">NOT KILLABLE</span>
                    <span style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>{proc.unkillableReason}</span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProcessKiller;
