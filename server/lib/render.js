const RENDER_API = 'https://api.render.com/v1';

function headers(token) {
  return {
    Authorization: `Bearer ${token || process.env.RENDER_API_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export async function testToken(token) {
  const res = await fetch(`${RENDER_API}/owners`, { headers: headers(token) });
  if (!res.ok) throw new Error(`Render auth failed (${res.status}). Check your API key.`);
  const owners = await res.json();
  if (!owners.length) throw new Error('No Render account found');
  return { ok: true, owner: owners[0].name || owners[0].id, message: `Connected to Render` };
}

export async function getOwner(token) {
  const res = await fetch(`${RENDER_API}/owners`, { headers: headers(token) });
  if (!res.ok) throw new Error('Cannot fetch Render owners');
  const owners = await res.json();
  if (!owners.length) throw new Error('No Render owner found');
  return owners[0];
}

export async function listServices(token) {
  const res = await fetch(`${RENDER_API}/services`, { headers: headers(token) });
  if (!res.ok) throw new Error(`Render API error: ${res.status}`);
  return res.json();
}

export async function createWebService({ name, repoUrl, branch = 'main', envVars = {}, token }) {
  const owner = await getOwner(token);

  const envPairs = Object.entries(envVars).map(([key, value]) => ({ key, value }));

  const res = await fetch(`${RENDER_API}/services`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      type: 'web_service',
      name,
      owner_id: owner.id,
      repo: repoUrl,
      branch,
      build_command: 'npm install',
      start_command: 'node server/index.js',
      env_vars: envPairs,
      auto_deploy: true,
      plan: 'free',
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `Render create error: ${res.status}`);
  }
  return res.json();
}

export async function updateServiceEnv(serviceId, envVars, token) {
  const envPairs = Object.entries(envVars).map(([key, value]) => ({ key, value }));

  const res = await fetch(`${RENDER_API}/services/${serviceId}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({ env_vars: envPairs }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `Render update error: ${res.status}`);
  }
  return res.json();
}

export async function createStaticSite({ name, repoUrl, branch = 'gh-pages', token }) {
  const owner = await getOwner(token);

  const res = await fetch(`${RENDER_API}/services`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({
      type: 'static_site',
      name,
      owner_id: owner.id,
      repo: repoUrl,
      branch,
      build_command: '',
      auto_deploy: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `Render create error: ${res.status}`);
  }
  return res.json();
}

export async function triggerDeploy(serviceId, token) {
  const res = await fetch(`${RENDER_API}/services/${serviceId}/deploys`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ clear_cache: 'do_not_clear' }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `Render deploy error: ${res.status}`);
  }
  return res.json();
}

export async function getService(serviceId, token) {
  const res = await fetch(`${RENDER_API}/services/${serviceId}`, { headers: headers(token) });
  if (!res.ok) throw new Error(`Render API error: ${res.status}`);
  return res.json();
}
