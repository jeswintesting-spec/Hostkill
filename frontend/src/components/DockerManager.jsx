import { useState, useEffect } from 'react';

function DockerManager() {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLogs, setActiveLogs] = useState(null);
  const [logsContent, setLogsContent] = useState('');

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/docker');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setContainers(data);
      setError(null);
    } catch (err) {
      setError("Docker daemon not running or access denied.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action, id) => {
    try {
      const res = await fetch(`/api/docker/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchContainers();
      } else {
        const text = await res.text();
        let errorMsg = text;
        try {
          const err = JSON.parse(text);
          errorMsg = err.error || err.message || text;
        } catch (e) {}
        alert(`Failed to ${action} container: ${errorMsg}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const viewLogs = async (id) => {
    if (activeLogs === id) {
      setActiveLogs(null);
      return;
    }
    setActiveLogs(id);
    setLogsContent('Loading logs...');
    try {
      const res = await fetch(`/api/docker/logs/${id}`);
      const data = await res.json();
      setLogsContent(data.logs || 'No logs available');
    } catch (err) {
      setLogsContent(`Error fetching logs: ${err.message}`);
    }
  };

  return (
    <div className="panel">
      <h2>
        <span>[DOCKER_CONTAINERS]</span>
        <button className="btn icon-only" onClick={fetchContainers} title="Refresh">↻</button>
      </h2>

      {error && <div style={{ color: 'var(--neon-pink)', marginBottom: '1rem' }}>ERROR: {error}</div>}
      {loading && containers.length === 0 && <div>Scanning container instances...</div>}

      <div className="docker-list">
        {containers.length === 0 && !loading && !error && <div>NO CONTAINERS FOUND</div>}
        {containers.map((c, idx) => {
          const isRunning = c.State === 'running';
          return (
            <div key={`${c.ID}-${idx}`} className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="item-details">
                  <div className="item-title">{c.Names}</div>
                  <div className="item-meta">
                    <span className={`badge ${isRunning ? 'green' : 'pink'}`}>{c.State.toUpperCase()}</span>
                    <span className="badge cyan">{c.Image}</span>
                    <span className="badge">{c.Status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {isRunning ? (
                    <button className="btn danger" onClick={() => handleAction('stop', c.ID)}>STOP</button>
                  ) : (
                    <button className="btn success" onClick={() => handleAction('start', c.ID)}>START</button>
                  )}
                  <button className="btn" onClick={() => viewLogs(c.ID)}>LOGS</button>
                </div>
              </div>
              
              {activeLogs === c.ID && (
                <div className="log-viewer">
                  {logsContent}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DockerManager;
