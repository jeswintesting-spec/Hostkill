const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const si = require('systeminformation');
const os = require('os');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const currentUser = os.userInfo().username;

// --- PORTS API ---
app.get('/api/ports', async (req, res) => {
    try {
        const connections = await si.networkConnections();
        const processes = await si.processes();
        
        const listenConns = connections.filter(c => c.state === 'LISTEN' && c.localPort);
        
        const ports = listenConns.map(conn => {
            const proc = processes.list.find(p => String(p.pid) === String(conn.pid)) || {};
            const processUser = proc.user || 'unknown';
            const portStr = String(conn.localPort);
            const commandStr = proc.name || 'unknown';
            
            let isKillable = processUser === currentUser || currentUser === 'root';
            let unkillableReason = isKillable ? null : 'Owned by another user';

            if (portStr === '3001') {
                isKillable = false;
                unkillableReason = 'HostKill Backend Process';
            } else if (portStr === '5173') {
                isKillable = false;
                unkillableReason = 'HostKill Frontend Process';
            } else if (commandStr.startsWith('antigravi') || commandStr.startsWith('language_')) {
                isKillable = false;
                unkillableReason = 'Critical System Process';
            }

            return {
                command: commandStr,
                pid: String(conn.pid),
                user: processUser,
                port: portStr,
                type: conn.protocol,
                node: 'TCP',
                killable: isKillable,
                unkillableReason: unkillableReason
            };
        }).filter(p => p.port !== 'Unknown' && p.pid !== String(process.pid) && p.pid !== '0' && p.pid !== '-1');

        // Deduplicate ports
        const uniquePorts = [];
        const seen = new Set();
        for (const p of ports) {
            const key = `${p.port}-${p.pid}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniquePorts.push(p);
            }
        }

        res.json(uniquePorts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch ports', details: error.message });
    }
});

app.post('/api/ports/kill', (req, res) => {
    const { pid } = req.body;
    if (!pid) return res.status(400).json({ error: 'PID is required' });

    try {
        process.kill(parseInt(pid, 10), 'SIGKILL');
        res.json({ success: true, message: `Process ${pid} killed` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to kill process', details: error.message });
    }
});

// --- PROCESSES API ---
app.get('/api/processes', async (req, res) => {
    try {
        const processes = await si.processes();
        
        // Filter, map, and sort processes
        const topProcesses = processes.list
            .filter(p => p.pid !== process.pid && p.pid !== 0)
            .map(p => {
                const processUser = p.user || 'unknown';
                const commandStr = p.name || 'unknown';
                
                let isKillable = processUser === currentUser || currentUser === 'root';
                let unkillableReason = isKillable ? null : 'Owned by another user';

                if (commandStr.includes('node') && p.command && p.command.includes('server.js')) {
                    isKillable = false;
                    unkillableReason = 'HostKill Backend Process';
                } else if (commandStr.startsWith('antigravi') || commandStr.startsWith('language_')) {
                    isKillable = false;
                    unkillableReason = 'Critical System Process';
                }

                return {
                    pid: String(p.pid),
                    command: commandStr,
                    user: processUser,
                    cpu: p.cpu.toFixed(1),
                    mem: p.mem.toFixed(1),
                    killable: isKillable,
                    unkillableReason: unkillableReason
                };
            })
            // Sort by CPU usage descending
            .sort((a, b) => parseFloat(b.cpu) - parseFloat(a.cpu))
            // Take top 10
            .slice(0, 10);

        res.json(topProcesses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch processes', details: error.message });
    }
});

// --- DOCKER API ---
app.get('/api/docker', (req, res) => {
    exec('docker ps -a --format "{{json .}}"', (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to fetch docker containers', details: error.message });
        }
        if (!stdout.trim()) return res.json([]);
        const containers = stdout.trim().split('\n').map(line => JSON.parse(line));
        res.json(containers);
    });
});

app.post('/api/docker/start', (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Container ID is required' });
    exec(`docker start ${id}`, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: 'Failed to start container', details: stderr || error.message });
        res.json({ success: true, message: `Container ${id} started` });
    });
});

app.post('/api/docker/stop', (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Container ID is required' });
    exec(`docker stop ${id}`, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: 'Failed to stop container', details: stderr || error.message });
        res.json({ success: true, message: `Container ${id} stopped` });
    });
});

app.get('/api/docker/logs/:id', (req, res) => {
    const { id } = req.params;
    exec(`docker logs --tail 50 ${id}`, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: 'Failed to fetch logs', details: error.message });
        res.json({ logs: stdout || stderr });
    });
});

// --- SYSTEM API ---
app.get('/api/system', async (req, res) => {
    try {
        const mem = await si.mem();
        const load = await si.currentLoad();
        const gpu = await si.graphics();
        
        const usedMemGB = mem.active / 1024 / 1024 / 1024;
        const totalMemGB = mem.total / 1024 / 1024 / 1024;
        const ramPercent = (mem.active / mem.total) * 100;

        let vramResponse = { error: 'Not Supported / Driver Error' };
        if (gpu && gpu.controllers && gpu.controllers.length > 0) {
            const controller = gpu.controllers[0];
            if (controller.vram && controller.memoryUsed) {
                vramResponse = {
                    percent: (controller.memoryUsed / controller.vram) * 100,
                    usedMB: controller.memoryUsed,
                    totalMB: controller.vram
                };
            }
        }

        res.json({
            cpu: load.currentLoad.toFixed(1),
            ram: {
                percent: ramPercent.toFixed(1),
                usedGB: usedMemGB.toFixed(1),
                totalGB: totalMemGB.toFixed(1)
            },
            vram: vramResponse
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch system stats' });
    }
});

// --- HARDWARE API ---
app.get('/api/hardware', async (req, res) => {
    try {
        const cpu = await si.cpu();
        const osInfo = await si.osInfo();
        const mem = await si.mem();
        const gpu = await si.graphics();
        
        let gpuModel = 'Unknown GPU';
        if (gpu && gpu.controllers && gpu.controllers.length > 0) {
            gpuModel = gpu.controllers[0].model || 'Unknown GPU';
        }

        res.json({
            cpu: `${cpu.manufacturer} ${cpu.brand}`,
            cores: cpu.cores,
            ram: `${(mem.total / 1024 / 1024 / 1024).toFixed(1)} GB`,
            os: `${osInfo.distro} ${osInfo.release} (${osInfo.arch})`,
            gpu: gpuModel
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch hardware stats' });
    }
});

// --- NETWORK API ---
let lastNetStats = { time: Date.now(), rx: 0, tx: 0 };

app.get('/api/network', async (req, res) => {
    try {
        const netStats = await si.networkStats();
        
        let totalRx = 0;
        let totalTx = 0;
        netStats.forEach(iface => {
            if (iface.iface !== 'lo') {
                totalRx += iface.rx_bytes;
                totalTx += iface.tx_bytes;
            }
        });

        const now = Date.now();
        const deltaSec = (now - lastNetStats.time) / 1000;
        
        let rxRate = 0;
        let txRate = 0;

        if (deltaSec > 0 && lastNetStats.time > 0) {
            rxRate = (totalRx - lastNetStats.rx) / deltaSec;
            txRate = (totalTx - lastNetStats.tx) / deltaSec;
        }

        if (rxRate < 0) rxRate = 0;
        if (txRate < 0) txRate = 0;

        lastNetStats = { time: now, rx: totalRx, tx: totalTx };

        res.json({
            rxRateBytes: rxRate,
            txRateBytes: txRate
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read network stats' });
    }
});

app.listen(PORT, () => {
    console.log(`HostKill Backend running on http://localhost:${PORT}`);
});
