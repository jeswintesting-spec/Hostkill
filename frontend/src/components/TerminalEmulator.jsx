import { useState, useRef, useEffect } from 'react';

function TerminalEmulator() {
  const [history, setHistory] = useState([
    { type: 'output', text: 'HostKill Command Shell initialized.' },
    { type: 'output', text: 'Type a command and press Enter.' }
  ]);
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState('~');
  const [isProcessing, setIsProcessing] = useState(false);
  const endRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Initial sync to get CWD
  useEffect(() => {
    fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'echo ""' }) // Dummy command to get cwd
    })
    .then(res => res.json())
    .then(data => {
        if(data.cwd) setCwd(data.cwd);
    }).catch(() => {});
  }, []);

  const handleCommand = async (e) => {
    if (e.key === 'Enter' && input.trim() && !isProcessing) {
      const cmd = input.trim();
      setInput('');
      setIsProcessing(true);

      // Add to history immediately
      setHistory(prev => [...prev, { type: 'input', text: `${cwd} $ ${cmd}` }]);

      if (cmd === 'clear') {
        setHistory([]);
        setIsProcessing(false);
        return;
      }

      try {
        const res = await fetch('/api/terminal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd })
        });
        
        const data = await res.json();
        
        if (data.cwd) {
            setCwd(data.cwd);
        }

        if (data.output && data.output.trim()) {
          setHistory(prev => [...prev, { type: 'output', text: data.output }]);
        }
      } catch (err) {
        setHistory(prev => [...prev, { type: 'error', text: `Connection Error: ${err.message}` }]);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="panel" style={{ gridColumn: '1 / -1' }}>
      <div className="panel-header">
        <h2>[EMBEDDED_TERMINAL]</h2>
      </div>
      
      <div 
        style={{ 
          backgroundColor: '#0a0a0a', 
          border: '1px solid var(--neon-cyan)',
          borderRadius: '4px',
          padding: '1rem',
          height: '400px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={() => document.getElementById('terminal-input').focus()}
      >
        {history.map((item, i) => (
          <div 
            key={i} 
            style={{ 
              color: item.type === 'error' ? 'var(--neon-pink)' : 
                     item.type === 'input' ? 'var(--neon-green)' : '#ccc',
              whiteSpace: 'pre-wrap',
              marginBottom: '4px',
              wordBreak: 'break-all'
            }}
          >
            {item.text}
          </div>
        ))}
        
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
          <span style={{ color: 'var(--neon-cyan)', marginRight: '8px', whiteSpace: 'nowrap' }}>
            {cwd} $
          </span>
          <input
            id="terminal-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleCommand}
            disabled={isProcessing}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              width: '100%',
              outline: 'none'
            }}
            autoComplete="off"
            spellCheck="false"
            autoFocus
          />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
}

export default TerminalEmulator;
