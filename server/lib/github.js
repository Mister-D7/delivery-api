import fs from 'fs';
import path from 'path';

const GITHUB_API = 'https://api.github.com';

function headers(token) {
  return {
    Authorization: `token ${token || process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'mister-dr-delivery',
  };
}

async function getLogin(token) {
  const res = await fetch(`${GITHUB_API}/user`, { headers: headers(token) });
  if (!res.ok) throw new Error(`GitHub auth failed (${res.status}). Check your token.`);
  const user = await res.json();
  return user.login;
}

export async function testToken(token) {
  const login = await getLogin(token);
  const reposRes = await fetch(`${GITHUB_API}/user/repos?per_page=1&sort=updated`, { headers: headers(token) });
  if (!reposRes.ok) throw new Error('Cannot read repositories');
  return { ok: true, login, message: `Authenticated as ${login}` };
}

export async function ensureRepo(repoName, token) {
  const t = token || process.env.GITHUB_TOKEN;
  const login = await getLogin(t);
  const fullRepo = `${login}/${repoName}`;

  const checkRes = await fetch(`${GITHUB_API}/repos/${fullRepo}`, { headers: headers(t) });
  if (checkRes.ok) {
    return { created: false, repo: fullRepo, url: `https://github.com/${fullRepo}` };
  }

  const res = await fetch(`${GITHUB_API}/user/repos`, {
    method: 'POST',
    headers: { ...headers(t), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: repoName,
      private: false,
      auto_init: true,
      description: 'MISTER-DR Delivery — Full Stack',
    }),
  });
  if (res.status === 201) {
    const repo = await res.json();
    return { created: true, repo: repo.full_name, url: repo.html_url };
  }
  if (res.status === 422) {
    return { created: false, repo: fullRepo, url: `https://github.com/${fullRepo}` };
  }
  const err = await res.json();
  throw new Error(err.message || `GitHub API error: ${res.status}`);
}

export async function pushFullCode(repoName, projectDir, token) {
  const t = token || process.env.GITHUB_TOKEN;
  const login = await getLogin(t);
  const fullRepo = `${login}/${repoName}`;

  const IGNORE = new Set(['node_modules', '.git', 'uploads', '.notifier-state.json', 'stderr.log', 'stdout.log']);
  const IGNORE_EXT = new Set(['.exe', '.dll', '.so', '.dylib']);

  const files = [];
  function readDir(dir, relative = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (IGNORE.has(entry.name)) continue;
      if (entry.name.startsWith('.') && entry.name !== '.env.example' && entry.name !== '.gitignore' && entry.name !== '.nvmrc') continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        readDir(fullPath, relPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (IGNORE_EXT.has(ext)) continue;
        if (entry.name === '.env') continue;
        const content = fs.readFileSync(fullPath);
        files.push({ path: relPath, content: content.toString('base64'), encoding: 'base64' });
      }
    }
  }
  readDir(projectDir);

  let baseTree;
  try {
    const refRes = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/ref/heads/main`, { headers: headers(t) });
    if (refRes.ok) {
      const ref = await refRes.json();
      baseTree = ref.object.sha;
    }
  } catch {}

  const BATCH_SIZE = 50;
  let currentTreeSha = baseTree || null;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    const blobPromises = batch.map(async (file) => {
      const res = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/blobs`, {
        method: 'POST',
        headers: { ...headers(t), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: file.content, encoding: 'base64' }),
      });
      const blob = await res.json();
      return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha };
    });

    const treeItems = await Promise.all(blobPromises);

    const treeRes = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/trees`, {
      method: 'POST',
      headers: { ...headers(t), 'Content-Type': 'application/json' },
      body: JSON.stringify({ tree: treeItems, base_tree: currentTreeSha }),
    });
    const newTree = await treeRes.json();
    currentTreeSha = newTree.sha;
  }

  if (!currentTreeSha) throw new Error('No files to push');

  const commitRes = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/commits`, {
    method: 'POST',
    headers: { ...headers(t), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Deploy v2.0.0 ${new Date().toISOString()}`,
      tree: currentTreeSha,
      parents: baseTree ? [baseTree] : [],
    }),
  });
  const commit = await commitRes.json();
  if (commit.message) throw new Error(`Commit failed: ${commit.message}`);

  const refExists = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/ref/heads/main`, { headers: headers(t) });
  if (refExists.ok) {
    await fetch(`${GITHUB_API}/repos/${fullRepo}/git/refs/heads/main`, {
      method: 'PATCH',
      headers: { ...headers(t), 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha: commit.sha, force: true }),
    });
  } else {
    await fetch(`${GITHUB_API}/repos/${fullRepo}/git/refs`, {
      method: 'POST',
      headers: { ...headers(t), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: 'refs/heads/main', sha: commit.sha }),
    });
  }

  return { repo: fullRepo, sha: commit.sha, fileCount: files.length };
}

export async function pushDistToRepo(repoName, distContents, token) {
  const t = token || process.env.GITHUB_TOKEN;
  const login = await getLogin(t);
  const fullRepo = `${login}/${repoName}`;
  const branch = 'gh-pages';

  let baseTree;
  try {
    const refRes = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/ref/heads/${branch}`, { headers: headers(t) });
    if (refRes.ok) {
      const ref = await refRes.json();
      baseTree = ref.object.sha;
    }
  } catch {}

  if (!baseTree) {
    const mainRef = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/ref/heads/main`, { headers: headers(t) });
    if (mainRef.ok) {
      const main = await mainRef.json();
      baseTree = main.object.sha;
    }
  }

  const blobPromises = distContents.map(async (file) => {
    const res = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/blobs`, {
      method: 'POST',
      headers: { ...headers(t), 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: file.content, encoding: file.encoding || 'utf-8' }),
    });
    const blob = await res.json();
    return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha };
  });

  const treeItems = await Promise.all(blobPromises);

  const treeRes = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/trees`, {
    method: 'POST',
    headers: { ...headers(t), 'Content-Type': 'application/json' },
    body: JSON.stringify({ tree: treeItems }),
  });
  const newTree = await treeRes.json();

  const commitRes = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/commits`, {
    method: 'POST',
    headers: { ...headers(t), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Deploy storefront ${new Date().toISOString()}`,
      tree: newTree.sha,
      parents: baseTree ? [baseTree] : [],
    }),
  });
  const commit = await commitRes.json();

  const refExists = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/ref/heads/${branch}`, { headers: headers(t) });
  if (refExists.ok) {
    await fetch(`${GITHUB_API}/repos/${fullRepo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: { ...headers(t), 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha: commit.sha, force: true }),
    });
  } else {
    await fetch(`${GITHUB_API}/repos/${fullRepo}/git/refs`, {
      method: 'POST',
      headers: { ...headers(t), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }),
    });
  }

  return { repo: fullRepo, branch, sha: commit.sha };
}
