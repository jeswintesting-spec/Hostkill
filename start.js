const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Helper function to run commands cross-platform and stream their output
const runCommand = (command, args, cwd, prefix, color) => {
    // Windows specifically requires 'npm.cmd' instead of 'npm'
    const isWin = os.platform() === 'win32';
    const cmd = isWin && command === 'npm' ? 'npm.cmd' : command;

    const child = spawn(cmd, args, { cwd, shell: true });

    child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim() !== '');
        lines.forEach(line => console.log(`${color}${prefix}\x1b[0m ${line}`));
    });

    child.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim() !== '');
        lines.forEach(line => console.error(`${color}${prefix}\x1b[0m \x1b[31m${line}\x1b[0m`));
    });

    child.on('close', (code) => {
        console.log(`${color}${prefix}\x1b[0m exited with code ${code}`);
        process.exit(code); // Kill everything if one component dies
    });

    return child;
};

console.log('\x1b[36m[HOSTKILL]\x1b[0m Booting up Local Command Center...\n');

// 1. Start the Node.js Backend Server
const backendPath = path.join(__dirname, 'backend');
runCommand('node', ['server.js'], backendPath, '[BACKEND ]', '\x1b[32m'); // Green prefix

// 2. Start the Vite React Frontend
const frontendPath = path.join(__dirname, 'frontend');
runCommand('npm', ['run', 'dev'], frontendPath, '[FRONTEND]', '\x1b[35m'); // Magenta prefix

// Handle Ctrl+C gracefully to kill both child processes
process.on('SIGINT', () => {
    console.log('\n\x1b[36m[HOSTKILL]\x1b[0m Shutting down systems...');
    process.exit(0);
});
