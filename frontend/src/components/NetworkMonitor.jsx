import { useState, useEffect } from 'react';

function NetworkMonitor() {
  const [stats, setStats] = useState({ rxRateBytes: 0, txRateBytes: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/network');
        if (!res.ok) throw new Error('Failed to fetch network stats');
        const data = await res.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0 || isNaN(bytes)) return '0.00 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    // prevent going out of bounds if bytes is very large
    const idx = Math.min(i, sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, idx)).toFixed(2)) + ' ' + sizes[idx];
  };

  if (error) {
    return <div className="panel" style={{ color: 'var(--neon-pink)', marginBottom: '2rem' }}>[NETWORK_MONITOR] ERROR: {error}</div>;
  }

  // Calculate percentage of an arbitrary "max" for visual flair (e.g., 50MB/s link)
  const maxBytes = 50 * 1024 * 1024;
  const rxPercent = Math.min((stats.rxRateBytes / maxBytes) * 100, 100);
  const txPercent = Math.min((stats.txRateBytes / maxBytes) * 100, 100);

  return (
    <div className="panel network-monitor" style={{ marginBottom: '2rem' }}>
      <h2>[NETWORK_BANDWIDTH]</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Download Speed */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--neon-cyan)' }}>DOWNLOAD_RX</span>
            <span style={{ fontWeight: 'bold' }}>{formatBytes(stats.rxRateBytes)}</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill cyan" 
              style={{ width: `${Math.max(rxPercent, 1)}%` }}
            ></div>
          </div>
        </div>

        {/* Upload Speed */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--neon-pink)' }}>UPLOAD_TX</span>
            <span style={{ fontWeight: 'bold' }}>{formatBytes(stats.txRateBytes)}</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill pink" 
              style={{ width: `${Math.max(txPercent, 1)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkMonitor;
