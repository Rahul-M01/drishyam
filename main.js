const { app, BrowserWindow } = require('electron');
const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

const BACKEND_PORT = 8080;

function killPort(port) {
  if (process.platform === 'win32') {
    try {
      const out = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf8' });
      const lines = out.trim().split('\n');
      const pids = new Set(lines.map(l => l.trim().split(/\s+/).pop()));
      for (const pid of pids) {
        try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch {}
      }
      console.log(`[Drishyam] Cleared port ${port}`);
    } catch {
      // nothing on the port, good
    }
  }
}
const FRONTEND_DIR = path.join(__dirname, 'frontend', 'dist');

let backendProcess = null;
let openclawProcess = null;
let proxyServer = null;
let mainWindow = null;

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };
  return types[ext] || 'application/octet-stream';
}

function startBackend() {
  const isWin = process.platform === 'win32';
  const gradlew = path.join(__dirname, isWin ? 'gradlew.bat' : 'gradlew');

  backendProcess = spawn(gradlew, ['bootRun'], {
    cwd: __dirname,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[Backend] ${data.toString().trim()}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`[Backend] exited with code ${code}`);
  });
}

function startOpenclaw() {
  const npxCmd = process.platform === 'win32' ? 'openclaw.cmd' : 'openclaw';

  try { execSync(`${npxCmd} gateway stop`, { stdio: 'ignore', shell: true, timeout: 5000 }); } catch {}

  openclawProcess = spawn(npxCmd, ['gateway'], {
    cwd: __dirname,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      OLLAMA_API_KEY: 'ollama-local',
      PATH: path.join(__dirname, 'scripts') + ';' + process.env.PATH,
    },
  });

  openclawProcess.stdout.on('data', (data) => {
    console.log(`[OpenClaw] ${data.toString().trim()}`);
  });

  openclawProcess.stderr.on('data', (data) => {
    console.error(`[OpenClaw] ${data.toString().trim()}`);
  });

  openclawProcess.on('close', (code) => {
    console.log(`[OpenClaw] exited with code ${code}`);
    openclawProcess = null;
  });
}

function waitForBackend(retries = 30, delay = 2000) {
  return new Promise((resolve, reject) => {
    function check(remaining) {
      if (remaining <= 0) return reject(new Error('Backend did not start in time'));

      const req = http.get(`http://localhost:${BACKEND_PORT}`, () => {
        resolve();
      });

      req.on('error', () => {
        setTimeout(() => check(remaining - 1), delay);
      });

      req.end();
    }
    check(retries);
  });
}

function startProxyServer() {
  return new Promise((resolve) => {
    proxyServer = http.createServer((req, res) => {
      if (req.url.startsWith('/api')) {
        const options = {
          hostname: 'localhost',
          port: BACKEND_PORT,
          path: req.url,
          method: req.method,
          headers: req.headers,
        };

        const proxyReq = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        });

        proxyReq.on('error', () => {
          res.writeHead(502);
          res.end('Backend unavailable');
        });

        req.pipe(proxyReq);
        return;
      }

      let filePath = path.join(FRONTEND_DIR, req.url === '/' ? 'index.html' : req.url);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(FRONTEND_DIR, 'index.html');
      }

      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
      res.end(content);
    });

    proxyServer.listen(0, 'localhost', () => {
      const port = proxyServer.address().port;
      console.log(`[Proxy] Serving on http://localhost:${port}`);
      resolve(port);
    });
  });
}

async function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Drishyam',
    icon: path.join(FRONTEND_DIR, 'favicon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`http://localhost:${port}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  killPort(BACKEND_PORT);

  console.log('[Drishyam] Starting backend...');
  startBackend();

  console.log('[Drishyam] Starting proxy server...');
  const proxyPort = await startProxyServer();

  console.log('[Drishyam] Waiting for backend to be ready...');
  try {
    await waitForBackend();
    console.log('[Drishyam] Backend is ready!');

    try {
      execSync(`node "${path.join(__dirname, 'scripts', 'sync-recipes.js')}"`, { stdio: 'inherit' });
      console.log('[Drishyam] Recipes synced to OpenClaw.');
    } catch { console.warn('[Drishyam] Recipe sync failed, continuing...'); }
  } catch {
    console.warn('[Drishyam] Backend may not be ready yet, opening window anyway...');
  }

  console.log('[Drishyam] Starting OpenClaw gateway...');
  startOpenclaw();

  await createWindow(proxyPort);
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
    if (process.platform === 'win32' && backendProcess.pid) {
      spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t'], { shell: true });
    }
  }
  if (openclawProcess) {
    openclawProcess.kill();
    if (process.platform === 'win32' && openclawProcess.pid) {
      spawn('taskkill', ['/pid', openclawProcess.pid, '/f', '/t'], { shell: true });
    }
  }
  if (proxyServer) {
    proxyServer.close();
  }
  app.quit();
});
