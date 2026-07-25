const GITHUB_API = 'https://api.github.com';

function headers() {
  return {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'mister-dr-delivery',
  };
}

export async function ensureRepo(repoName) {
  const res = await fetch(`${GITHUB_API}/user/repos`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: repoName,
      private: false,
      auto_init: true,
      description: 'MISTER-DR Delivery Storefront',
    }),
  });
  if (res.status === 201) {
    const repo = await res.json();
    return { created: true, repo: repo.full_name, url: repo.html_url };
  }
  if (res.status === 422) {
    const user = await fetch(`${GITHUB_API}/user`, { headers: headers() }).then(r => r.json());
    return { created: false, repo: `${user.login}/${repoName}`, url: `https://github.com/${user.login}/${repoName}` };
  }
  const err = await res.json();
  throw new Error(err.message || `GitHub API error: ${res.status}`);
}

export async function pushDistToRepo(repoName, distContents) {
  const user = await fetch(`${GITHUB_API}/user`, { headers: headers() }).then(r => r.json());
  const fullRepo = `${user.login}/${repoName}`;
  const branch = 'gh-pages';

  let baseTree;
  try {
    const refRes = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/ref/heads/${branch}`, { headers: headers() });
    if (refRes.ok) {
      const ref = await refRes.json();
      baseTree = ref.object.sha;
    }
  } catch {}

  if (!baseTree) {
    const mainRef = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/ref/heads/main`, { headers: headers() });
    if (mainRef.ok) {
      const main = await mainRef.json();
      baseTree = main.object.sha;
    }
  }

  const blobPromises = distContents.map(async (file) => {
    const res = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/blobs`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: file.content,
        encoding: file.encoding || 'utf-8',
      }),
    });
    const blob = await res.json();
    return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha };
  });

  const treeItems = await Promise.all(blobPromises);

  const treeRes = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/trees`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ tree: treeItems }),
  });
  const newTree = await treeRes.json();

  const commitRes = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/commits`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `Deploy storefront ${new Date().toISOString()}`,
      tree: newTree.sha,
      parents: baseTree ? [baseTree] : [],
    }),
  });
  const commit = await commitRes.json();

  const refExists = await fetch(`${GITHUB_API}/repos/${fullRepo}/git/ref/heads/${branch}`, { headers: headers() });
  if (refExists.ok) {
    await fetch(`${GITHUB_API}/repos/${fullRepo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha: commit.sha, force: true }),
    });
  } else {
    await fetch(`${GITHUB_API}/repos/${fullRepo}/git/refs`, {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }),
    });
  }

  return { repo: fullRepo, branch, sha: commit.sha };
}
