import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import multer, { Multer } from 'multer';
import unzipper from 'unzipper';

const router = Router();
const DATA_DIR = path.resolve(__dirname, '../../data');
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

// Ensure upload dir exists
fs.ensureDirSync(UPLOAD_DIR);

// Multer setup for zip uploads
const upload = multer({ dest: UPLOAD_DIR });

// GET /admin/data/download - Download data folder as zip
router.get('/data/download', async (req: Request, res: Response) => {
  const zipName = `data-backup-${Date.now()}.zip`;
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename=${zipName}`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.directory(DATA_DIR, false);
  archive.finalize();
  archive.pipe(res);

  archive.on('error', err => {
    res.status(500).send('Error creating zip');
  });
});

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

router.post('/data/restore', upload.single('zip'), async (req: Request, res: Response) => {
  const file = req.file as MulterFile | undefined;
  if (!file) return res.status(400).send('No zip file uploaded');
  const zipPath = file.path;
  try {
    // Remove current data folder
    await fs.remove(DATA_DIR);
    await fs.ensureDir(DATA_DIR);
    // Extract zip to data folder
    await new Promise<void>((resolve, reject) => {
      const stream = fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: DATA_DIR }));
      stream.on('close', resolve);
      stream.on('error', reject);
    });
    await fs.remove(zipPath);
    return res.send('Data restored successfully');
  } catch (err) {
    return res.status(500).send('Failed to restore data');
  }
});

export default router;
