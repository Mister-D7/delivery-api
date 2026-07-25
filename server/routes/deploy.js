import { Router } from 'express';
import { adminAuth } from '../middleware/auth.js';
import { ensureRepo, pushDistToRepo } from '../lib/github.js';
import { listServices, createStaticSite, triggerDeploy } from '../lib/render.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

function getDistContents() {
  const distDir = path.join(__dirname, '..', '..', 'web', 'dist');
  if (!fs.existsSync(distDir)) throw new Error('No dist/ folder found. Run "npm run build" first.');

  const files = [];
  function readDir(dir, relative = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const relPath = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        readDir(fullPath, relPath);
      } else {
        const content = fs.readFileSync(fullPath);
        files.push({
          path: relPath,
          content: content.toString('base64'),
          encoding: 'base64',
        });
      }
    }
  }
  readDir(distDir);
  return files;
}

// POST /deploy/preview — dry run, show what would happen
router.get('/preview', adminAuth, async (req, res) => {
  try {
    const hasToken = !!process.env.GITHUB_TOKEN;
    const hasRenderKey = !!process.env.RENDER_API_KEY;
    const distDir = path.join(__dirname, '..', '..', 'web', 'dist');
    const hasDist = fs.existsSync(distDir);
    let fileCount = 0;
    if (hasDist) {
      function countFiles(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.isDirectory()) countFiles(path.join(dir, entry.name));
          else fileCount++;
        }
      }
      countFiles(distDir);
    }

    res.json({
      ready: hasToken && hasRenderKey && hasDist,
      github: hasToken,
      render: hasRenderKey,
      distExists: hasDist,
      fileCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /deploy — full deploy
router.post('/', adminAuth, async (req, res) => {
  const steps = [];
  const log = (msg, ok = true) => steps.push({ msg, ok });

  try {
    if (!process.env.GITHUB_TOKEN) throw new Error('GitHub token not configured. Run setup first.');
    if (!process.env.RENDER_API_KEY) throw new Error('Render API key not configured. Run setup first.');

    log('📦 Building frontend...');
    const distContents = getDistContents();
    log(`  Found ${distContents.length} files`);

    log('🐙 Pushing to GitHub...');
    const repoName = req.body.repoName || 'delivery-storefront';
    const repo = await ensureRepo(repoName);
    log(`  Repo: ${repo.repo}`);
    const push = await pushDistToRepo(repoName, distContents);
    log(`  Pushed to ${push.branch} (${push.sha.slice(0, 7)})`);

    log('🚀 Deploying to Render...');
    const services = await listServices();
    let service = services.find(s => s.name === repoName && s.type === 'static_site');

    if (service) {
      await triggerDeploy(service.id);
      log(`  Redeployed existing service: ${service.name}`);
    } else {
      const ownerRes = await fetch('https://api.render.com/v1/owners', {
        headers: { Authorization: `Bearer ${process.env.RENDER_API_KEY}`, Accept: 'application/json' },
      });
      const owners = await ownerRes.json();
      if (!owners.length) throw new Error('No Render owner found');

      service = await createStaticSite({
        name: repoName,
        repoUrl: `https://github.com/${push.repo}.git`,
        branch: push.branch,
      });
      log(`  Created new service: ${service.name}`);
    }

    const url = service.service?.url || service.url || `https://${repoName}.onrender.com`;
    log(`\n✅ Deployed! ${url}`);
    res.json({ ok: true, steps, url, repo: push.repo });
  } catch (err) {
    log(`❌ ${err.message}`, false);
    res.status(500).json({ ok: false, steps, error: err.message });
  }
});

export default router;
