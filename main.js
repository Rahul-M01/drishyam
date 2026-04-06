const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

const BACKEND_PORT = 8080;
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

  openclawProcess = spawn(npxCmd, ['gateway'], {
    cwd: __dirname,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
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
      // Proxy /api requests to Spring Boot
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

      // Serve static frontend files
      let filePath = path.join(FRONTEND_DIR, req.url === '/' ? 'index.html' : req.url);

      // SPA fallback — serve index.html for routes that don't match a file
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
  console.log('[Drishyam] Starting backend...');
  startBackend();

  console.log('[Drishyam] Starting proxy server...');
  const proxyPort = await startProxyServer();

  console.log('[Drishyam] Waiting for backend to be ready...');
  try {
    await waitForBackend();
    console.log('[Drishyam] Backend is ready!');
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
