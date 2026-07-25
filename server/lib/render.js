const RENDER_API = 'https://api.render.com/v1';

function headers() {
  return {
    Authorization: `Bearer ${process.env.RENDER_API_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

export async function listServices() {
  const res = await fetch(`${RENDER_API}/services`, { headers: headers() });
  if (!res.ok) throw new Error(`Render API error: ${res.status}`);
  return res.json();
}

export async function createStaticSite({ name, repoUrl, branch = 'gh-pages' }) {
  const ownerRes = await fetch(`${RENDER_API}/owners`, { headers: headers() });
  const owners = await ownerRes.json();
  const owner = owners[0];
  if (!owner) throw new Error('No Render owner found');

  const res = await fetch(`${RENDER_API}/services`, {
    method: 'POST',
    headers: headers(),
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

export async function triggerDeploy(serviceId) {
  const res = await fetch(`${RENDER_API}/services/${serviceId}/deploys`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ clear_cache: 'do_not_clear' }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `Render deploy error: ${res.status}`);
  }
  return res.json();
}

export async function getService(serviceId) {
  const res = await fetch(`${RENDER_API}/services/${serviceId}`, { headers: headers() });
  if (!res.ok) throw new Error(`Render API error: ${res.status}`);
  return res.json();
}
