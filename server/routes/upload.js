import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { adminAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// Ensure directories exist
fs.mkdirSync(path.join(uploadsDir, 'images'), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, 'videos'), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, 'voice'), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, 'background'), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, 'models'), { recursive: true });

// --- Multer instances ---

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(uploadsDir, 'images')),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 230 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) cb(null, true);
    else cb(new Error('Seules les images .jpg, .png, .webp, .gif, .svg sont acceptées'));
  },
});

const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(uploadsDir, 'videos')),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 230 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, true);
  },
});

const voiceUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(uploadsDir, 'voice')),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 230 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.webm', '.m4a'].includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers audio sont acceptés'));
    }
  },
});

const bgUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(uploadsDir, 'background')),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `bg-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 230 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Seules les images et vidéos sont acceptées'));
  },
});

// --- Routes ---

const router = Router();

// POST /upload/image
router.post('/image', adminAuth, (req, res, next) => {
  imageUpload.single('image')(req, res, (err) => {
    if (err) {
      console.error('[Upload Image]', err.message);
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'Aucune image' });
    res.json({ url: `/uploads/images/${req.file.filename}` });
  });
});

// POST /upload/video
router.post('/video', adminAuth, (req, res, next) => {
  videoUpload.single('video')(req, res, (err) => {
    if (err) {
      console.error('[Upload Video]', err.message);
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'Aucune vidéo' });
    res.json({ url: `/uploads/videos/${req.file.filename}` });
  });
});

// POST /upload/background
router.post('/background', adminAuth, (req, res, next) => {
  bgUpload.single('image')(req, res, (err) => {
    if (err) {
      console.error('[Upload Background]', err.message);
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
    res.json({ url: `/uploads/background/${req.file.filename}` });
  });
});

// POST /upload/voice
router.post('/voice', adminAuth, (req, res, next) => {
  voiceUpload.single('audio')(req, res, (err) => {
    if (err) {
      console.error('[Upload Voice]', err.message);
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'Aucun audio' });
    res.json({ url: `/uploads/voice/${req.file.filename}` });
  });
});

// POST /upload/model
router.post('/model', adminAuth, (req, res, next) => {
  const modelUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, path.join(uploadsDir, 'models')),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `model-${Date.now()}${ext}`);
      },
    }),
    limits: { fileSize: 230 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.glb', '.gltf', '.fbx', '.obj'].includes(ext)) cb(null, true);
      else cb(new Error('Seuls les modèles 3D (.glb/.gltf/.fbx/.obj) sont acceptés'));
    },
  });
  modelUpload.single('model')(req, res, (err) => {
    if (err) {
      console.error('[Upload Model]', err.message);
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'Aucun modèle' });
    res.json({ url: `/uploads/models/${req.file.filename}` });
  });
});

// POST /upload/voice/public
router.post('/voice/public', (req, res, next) => {
  voiceUpload.single('audio')(req, res, (err) => {
    if (err) {
      console.error('[Upload Voice Public]', err.message);
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'Aucun audio' });
    res.json({ url: `/uploads/voice/${req.file.filename}` });
  });
});

export default router;
