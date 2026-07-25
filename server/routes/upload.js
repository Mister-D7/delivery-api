import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../lib/supabase.js';
import { adminAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temp dir for multer before uploading to Supabase
const tmpDir = path.join(__dirname, '..', '..', 'uploads', 'tmp');
fs.mkdirSync(tmpDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tmpDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) cb(null, true);
    else cb(new Error('Only .jpg, .png, .webp images accepted'));
  },
});

const voiceUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.webm', '.m4a'].includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files accepted'));
    }
  },
});

async function uploadToStorage(filePath, bucket, upsertPath) {
  const fileBuffer = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(upsertPath, fileBuffer, {
      contentType: getContentType(filePath),
      upsert: true,
    });
  // Clean up temp file
  fs.unlinkSync(filePath);
  if (error) throw error;
  // Return public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(upsertPath);
  return urlData.publicUrl;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.webm': 'audio/webm', '.m4a': 'audio/mp4' };
  return types[ext] || 'application/octet-stream';
}

const router = Router();

// POST /upload/image — admin, upload image to Supabase Storage
router.post('/image', adminAuth, imageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file' });
    const upsertPath = `images/${req.file.filename}`;
    const publicUrl = await uploadToStorage(req.file.path, 'delivery', upsertPath);
    res.json({ url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /upload/voice — admin, upload voice to Supabase Storage
router.post('/voice', adminAuth, voiceUpload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file' });
    const upsertPath = `voice/${req.file.filename}`;
    const publicUrl = await uploadToStorage(req.file.path, 'delivery', upsertPath);
    res.json({ url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /upload/voice/public — public voice upload
router.post('/voice/public', voiceUpload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file' });
    const upsertPath = `voice/${req.file.filename}`;
    const publicUrl = await uploadToStorage(req.file.path, 'delivery', upsertPath);
    res.json({ url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
