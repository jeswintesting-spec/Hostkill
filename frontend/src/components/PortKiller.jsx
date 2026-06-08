import { useState, useEffect } from 'react';

function PortKiller() {
  const [ports, setPorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingPid, setConfirmingPid] = useState(null);

  const fetchPorts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ports');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const sortedData = data.sort((a, b) => {
        if (a.killable === b.killable) return 0;
        return a.killable ? -1 : 1;
      });
      setPorts(sortedData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPorts();
    const interval = setInterval(fetchPorts, 5000);
    return () => clearInterval(interval);
  }, []);

  const killPort = async (pid, port) => {
    try {
      const res = await fetch('/api/ports/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid })
      });
      if (res.ok) {
        setConfirmingPid(null);
        fetchPorts();
      } else {
        const text = await res.text();
        let errorMsg = text;
        try {
          const err = JSON.parse(text);
          errorMsg = err.error || err.message || text;
        } catch (e) {}
        alert(`Failed to kill process: ${errorMsg}`);
      }
      } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setConfirmingPid(null);
    }
  };

  return (
    <div className="panel">
      <h2>
        <span>[ACTIVE_PORTS]</span>
        <button className="btn icon-only" onClick={fetchPorts} title="Refresh">↻</button>
      </h2>
      
      {error && <div style={{ color: 'var(--neon-pink)', marginBottom: '1rem' }}>ERROR: {error}</div>}
      {loading && ports.length === 0 && <div>Scanning system ports...</div>}
      
      <div className="port-list">
        {ports.length === 0 && !loading && !error && <div>NO ACTIVE PORTS DETECTED</div>}
        {ports.map((p, idx) => (
          <div key={`${p.pid}-${idx}`} className="list-item">
            <div className="item-details">
              <div className="item-title">PORT: {p.port}</div>
              <div className="item-meta">
                <span className="badge cyan">{p.command}</span>
                <span className="badge">PID: {p.pid}</span>
                <span className="badge">USER: {p.user}</span>
                <span className="badge">TYPE: {p.type || 'N/A'}</span>
                <span className="badge">NODE: {p.node || 'N/A'}</span>
                {p.killable ? <span className="badge green">KILLABLE</span> : <span className="badge pink">NOT KILLABLE: {p.unkillableReason || 'UNKNOWN REASON'}</span>}
              </div>
            </div>
            {confirmingPid === p.pid ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn danger" onClick={() => killPort(p.pid, p.port)}>SURE?</button>
                <button className="btn" onClick={() => setConfirmingPid(null)}>CANCEL</button>
              </div>
            ) : (
              <button className={`btn danger ${!p.killable ? 'disabled' : ''}`} onClick={() => p.killable && setConfirmingPid(p.pid)} disabled={!p.killable} title={!p.killable ? 'Process owned by another user' : ''}>KILL</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PortKiller;
