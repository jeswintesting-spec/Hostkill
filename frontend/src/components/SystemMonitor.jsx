import { useState, useEffect } from 'react';

function SystemMonitor() {
  const [stats, setStats] = useState(null);
  const [hw, setHw] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch static hardware info once
    fetch('/api/hardware')
      .then(res => res.json())
      .then(data => setHw(data))
      .catch(err => console.error('Failed to fetch hardware info', err));

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/system');
        if (!res.ok) throw new Error('Failed to fetch system stats');
        const data = await res.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <div className="panel" style={{ color: 'var(--neon-pink)' }}>[SYSTEM_MONITOR] ERROR: {error}</div>;
  }

  if (!stats || !hw) {
    return <div className="panel">[SYSTEM_MONITOR] INITIALIZING SENSORS...</div>;
  }

  const renderBar = (label, value, percent, meta, errorMsg = null) => {
    let colorClass = 'cyan';
    if (percent > 85) colorClass = 'pink';
    else if (percent > 60) colorClass = 'green';

    return (
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
          <span>{label}</span>
          {errorMsg ? (
            <span style={{ color: 'var(--neon-pink)' }}>{errorMsg}</span>
          ) : (
            <span>{value} {meta && <span style={{ color: '#888', marginLeft: '5px' }}>[{meta}]</span>}</span>
          )}
        </div>
        <div className="progress-bar-container">
          <div 
            className={`progress-bar-fill ${errorMsg ? 'error' : colorClass}`} 
            style={{ width: `${errorMsg ? 0 : percent}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="panel system-monitor" style={{ marginBottom: '2rem' }}>
      <h2>[SYSTEM_RESOURCES]</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem' 
      }}>
        {/* Hardware Specs */}
        <div className="hw-specs" style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: '1.6' }}>
          <div style={{ color: 'var(--neon-cyan)', marginBottom: '0.5rem', fontWeight: 'bold' }}>// HARDWARE_SPECS</div>
          <div><span style={{ color: '#888' }}>OS_TYPE:</span> {hw.os}</div>
          <div><span style={{ color: '#888' }}>CPU_MOD:</span> {hw.cpu} ({hw.cores} Cores)</div>
          <div><span style={{ color: '#888' }}>RAM_TOT:</span> {hw.ram}</div>
          <div><span style={{ color: '#888' }}>GPU_MOD:</span> <span style={{ fontSize: '0.8rem' }}>{hw.gpu}</span></div>
        </div>

        {/* Real-time Bars */}
        <div className="resource-bars">
          <div style={{ color: 'var(--neon-cyan)', marginBottom: '0.5rem', fontWeight: 'bold' }}>// LIVE_SENSORS</div>
          {renderBar('CPU_LOAD', `${stats.cpu}%`, parseFloat(stats.cpu))}
          
          {renderBar(
            'MEM_USAGE', 
            `${stats.ram.usedGB}GB / ${stats.ram.totalGB}GB (${stats.ram.percent}%)`, 
            parseFloat(stats.ram.percent)
          )}
          
          {stats.vram.error ? (
            renderBar('GPU_VRAM', null, 0, null, `[OFFLINE] ${stats.vram.error.toUpperCase()}`)
          ) : (
            renderBar(
              'GPU_VRAM', 
              `${stats.vram.usedMB}MB / ${stats.vram.totalMB}MB (${stats.vram.percent}%)`, 
              parseFloat(stats.vram.percent)
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default SystemMonitor;
