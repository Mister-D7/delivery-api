import { spawn } from 'node:child_process';
import process from 'node:process';

const OD_EXE = 'F:\\Open Design\\Open Design.exe';
const DAEMON_CLI = 'F:\\Open Design\\resources\\app\\prebundled\\daemon\\daemon-cli.mjs';
const ENV_EXTRA = {
  OD_DATA_DIR: 'C:\\Users\\KeepCool\\AppData\\Roaming\\Open Design\\namespaces\\release-stable-win\\data',
  OD_SIDECAR_IPC_PATH: '\\\\.\\pipe\\open-design-release-stable-win-daemon',
  ELECTRON_RUN_AS_NODE: '1',
};

const tool = process.argv[2];
if (!tool) {
  console.error('Usage: node od-mcp.mjs <tool> [json-arguments]   |   node od-mcp.mjs <tool> < args.json');
  process.exit(1);
}
let args = {};
const argsJson = process.argv[3];
if (argsJson) {
  try { args = JSON.parse(argsJson); } catch (e) { console.error('Invalid JSON arguments:', e.message); process.exit(1); }
} else if (!process.stdin.isTTY) {
  try {
    const raw = await new Promise((resolve) => {
      let data = '';
      process.stdin.on('data', (d) => { data += d.toString('utf8'); });
      process.stdin.on('end', () => resolve(data));
    });
    args = raw.trim() ? JSON.parse(raw) : {};
  } catch (e) { console.error('Invalid JSON on stdin:', e.message); process.exit(1); }
}

const child = spawn(OD_EXE, [DAEMON_CLI, 'mcp'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, ...ENV_EXTRA },
});

let buffer = '';
let requestId = 0;
const pending = new Map();

child.stderr.on('data', (d) => { process.stderr.write(`[mcp-stderr] ${d}`); });
child.on('exit', (code) => { if (!buffer.length) process.exit(code ?? 1); });

function nextId() { return ++requestId; }

function send(obj) {
  child.stdin.write(JSON.stringify(obj) + '\n');
}

function waitResponse(id, timeoutMs = 300000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`timeout waiting for response to id=${id}`));
    }, timeoutMs);
    pending.set(id, { resolve, timer });
  });
}

child.stdout.on('data', (d) => {
  buffer += d.toString('utf8');
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      clearTimeout(p.timer);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    }
  }
});

async function main() {
  const init = await new Promise((resolve, reject) => {
    const id = nextId();
    const t = setTimeout(() => reject(new Error('timeout during initialize')), 30000);
    pending.set(id, { resolve: (r) => { clearTimeout(t); resolve(r); }, timer: t });
    send({ jsonrpc: '2.0', id, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'od-drive', version: '1.0' } } });
  });

  send({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });

  const id = nextId();
  const response = waitResponse(id, 600000);
  if (tool.startsWith('tools/')) {
    send({ jsonrpc: '2.0', id, method: tool, params: args });
  } else {
    send({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: tool, arguments: args } });
  }
  const result = await response;
  console.log(JSON.stringify(result, null, 2));
  child.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  child.kill();
  process.exit(1);
});
