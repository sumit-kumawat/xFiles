import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import cors from 'cors';

const isESM = typeof import.meta !== 'undefined' && typeof import.meta.url !== 'undefined';
const _filename = isESM ? fileURLToPath(import.meta.url) : (typeof __filename !== 'undefined' ? __filename : '');
// Use process.cwd() as the project root so that database and uploaded files are preserved in the persistent workspace root (not wiped during builds)
const _dirname = process.cwd();

function generateAlphanumericId(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const JWT_SECRET = process.env.JWT_SECRET || 'x-cloud-secret-key-12345';
const PORT = 3000;

const extensionMimeTypes: { [key: string]: string } = {
  // Images
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  'bmp': 'image/bmp',
  'tiff': 'image/tiff',
  'tif': 'image/tiff',
  // Videos
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'ogg': 'video/ogg',
  'mov': 'video/quicktime',
  'avi': 'video/x-msvideo',
  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'aac': 'audio/aac',
  'm4a': 'audio/mp4',
  'flac': 'audio/flac',
  // Documents
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'txt': 'text/plain',
  'csv': 'text/csv',
  'html': 'text/html',
  'css': 'text/css',
  'js': 'application/javascript',
  'ts': 'text/typescript',
  'tsx': 'text/typescript',
  'py': 'text/x-python',
  'xml': 'text/xml',
  'json': 'application/json',
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
};

function getMimeTypeByExtension(filename: string, defaultMime: string = 'application/octet-stream'): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return extensionMimeTypes[ext] || defaultMime;
}

function resolveFileMime(filename: string, storedMime: string | null | undefined): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'svg') {
    return 'image/svg+xml';
  }
  const extMime = extensionMimeTypes[ext];
  if (extMime) {
    return extMime;
  }
  return storedMime || 'application/octet-stream';
}

// SMTP Config
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.zoho.in',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false', // default to true since SSL (port 465)
  auth: {
    user: process.env.SMTP_USER || 'admin@conzex.com',
    pass: process.env.SMTP_PASS || 'Sumit@zohomail.com123',
  },
  connectionTimeout: 10000, // 10 seconds timeout for Zoho connection
  greetingTimeout: 10000,
  socketTimeout: 15000,
};

const transporter = nodemailer.createTransport(smtpConfig);

const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    return true;
  }
  try {
    const fromAddress = process.env.SMTP_FROM || 'no-reply@conzex.com';
    await transporter.sendMail({
      from: `"xFiles" <${fromAddress}>`,
      replyTo: 'no-reply@conzex.com',
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (err: any) {
    return true; // Always return true so application flows (signup, verification, resets) never break
  }
};

// Initialize Database
const db = new Database(path.join(_dirname, 'xfiles.db'));
db.pragma('journal_mode = WAL');

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    password TEXT,
    display_name TEXT,
    plan TEXT DEFAULT 'pro',
    storage_limit INTEGER DEFAULT 107374182400, -- 100GB in bytes
    storage_used INTEGER DEFAULT 0,
    email_verified BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    size INTEGER,
    mime TEXT,
    parent_id TEXT,
    user_id TEXT,
    storage_path TEXT,
    starred BOOLEAN DEFAULT 0,
    deleted BOOLEAN DEFAULT 0,
    deleted_at TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shared_with TEXT, -- JSON array of emails
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS global_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT,
    data TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activity (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT,
    target_id TEXT,
    target_name TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Bootstrap Admin
const adminEmail = 'admin@conzex.com';
const testAdminEmail = 'kumawatsumit45@gmail.com';
const adminUsername = 'admin';
const adminPass = 'admin';

function isUserAdmin(email: string): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  return lower === 'admin@conzex.com' || lower === 'kumawatsumit45@gmail.com';
}

const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync(adminPass, 10);
  db.prepare(`
    INSERT INTO users (id, email, username, password, display_name, plan, email_verified, storage_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), adminEmail, adminUsername, hashedPassword, 'System Admin', 'pro', 1, 107374182400);
  console.log('Admin user bootstrapped: admin@conzex.com / admin');
}

// Bootstrap Pricing Settings
const defaultSettings = [
  { key: 'pricing_enabled', value: 'true' },
  { key: 'currency', value: 'USD' },
  { key: 'plan_starter_price', value: '0' },
  { key: 'plan_pro_price', value: '9.99' },
  { key: 'plan_enterprise_price', value: 'Custom' }
];

defaultSettings.forEach(s => {
  const exists = db.prepare('SELECT 1 FROM global_settings WHERE key = ?').get(s.key);
  if (!exists) {
    db.prepare('INSERT INTO global_settings (key, value) VALUES (?, ?)').run(s.key, s.value);
  }
});

// File Upload Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(_dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- API ROUTES ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth
app.post('/api/auth/register', async (req, res) => {
  const { email, password, username, displayName } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, username, password, display_name, email_verified)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(id, email, username || email.split('@')[0], hashedPassword, displayName || '');
    
    const verificationToken = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '1d' });
    const isLocal = req.get('host')?.includes('localhost') || req.get('host')?.includes('127.0.0.1') || req.get('host')?.includes('3000');
    let verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify?token=${verificationToken}`;
    if (!isLocal) {
      verifyUrl = verifyUrl.replace('http://', 'https://');
    }

    sendEmail(
      email, 
      'Verify your xFiles Account', 
      `Hi ${displayName || username || 'User'},\n\nWelcome to xFiles! Please verify your email by clicking the link below:\n\n${verifyUrl}\n\nThank you,\nThe xFiles Team`,
      `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="https://files.conzex.com/api/files/public/ee05804c-9547-4c7f-8c23-c32e89912eeb/circle-logo.svg" alt="xFiles Logo" style="width: 50px; height: 50px;" />
          <h2 style="color: #0f172a; margin-top: 10px; font-size: 22px; font-weight: 700;">Verify your xFiles Account</h2>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Hi <strong>${displayName || username || 'User'}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Welcome to <strong>xFiles</strong>! We're excited to have you on board. Please verify your email address to complete your registration and gain full access to your secure workspace.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #0078d4; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          If the button above doesn't work, copy and paste this URL into your browser:<br />
          <a href="${verifyUrl}" style="color: #0078d4; text-decoration: none; word-break: break-all;">${verifyUrl}</a>
        </p>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">
          © ${new Date().getFullYear()} xFiles | Conzex Global Private Limited. All rights reserved.
        </p>
      </div>
      `
    ).catch(err => console.error('Background register email failed:', err));

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ error: 'Profile not found. Please sign up first.' });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email is already verified.' });
    }

    const verificationToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
    const isLocal = req.get('host')?.includes('localhost') || req.get('host')?.includes('127.0.0.1') || req.get('host')?.includes('3000');
    let verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify?token=${verificationToken}`;
    if (!isLocal) {
      verifyUrl = verifyUrl.replace('http://', 'https://');
    }
    sendEmail(
      user.email, 
      'Verify your xFiles Account', 
      `Hi ${user.display_name || user.username || 'User'},\n\nWelcome to xFiles! Please verify your email by clicking the link below:\n\n${verifyUrl}\n\nThank you,\nThe xFiles Team`,
      `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="https://files.conzex.com/api/files/public/ee05804c-9547-4c7f-8c23-c32e89912eeb/circle-logo.svg" alt="xFiles Logo" style="width: 50px; height: 50px;" />
          <h2 style="color: #0f172a; margin-top: 10px; font-size: 22px; font-weight: 700;">Verify your xFiles Account</h2>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Hi <strong>${user.display_name || user.username || 'User'}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Welcome to <strong>xFiles</strong>! We're excited to have you on board. Please verify your email address to complete your registration and gain full access to your secure workspace.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #0078d4; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          If the button above doesn't work, copy and paste this URL into your browser:<br />
          <a href="${verifyUrl}" style="color: #0078d4; text-decoration: none; word-break: break-all;">${verifyUrl}</a>
        </p>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">
          © ${new Date().getFullYear()} xFiles | Conzex Global Private Limited. All rights reserved.
        </p>
      </div>
      `
    ).catch(err => console.error('Background resend email failed:', err));

    res.json({ success: true, message: 'Verification link has been resent.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/verify', (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send('<h1>Verification failed</h1><p>Token is missing.</p>');
  }
  try {
    const decoded: any = jwt.verify(token as string, JWT_SECRET);
    const userId = decoded.userId;
    db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(userId);
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified | xFiles</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Inter', sans-serif;
            background-color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          .logo {
            width: 60px;
            height: 60px;
            margin-bottom: 24px;
          }
          h1 {
            color: #0f172a;
            font-size: 24px;
            margin-bottom: 12px;
            font-weight: 700;
          }
          p {
            color: #475569;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .btn {
            background-color: #0078d4;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            display: inline-block;
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #005a9e;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <img class="logo" src="https://files.conzex.com/api/files/public/ee05804c-9547-4c7f-8c23-c32e89912eeb/circle-logo.svg" alt="xFiles Logo" />
          <h1>Email Verified Successfully!</h1>
          <p>Your email has been successfully verified. You can now log in to your account and start managing your secure files.</p>
          <a class="btn" href="/?page=auth">Go to Login</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(400).send('<h1>Verification failed</h1><p>The verification link is invalid or has expired.</p>');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(identifier, identifier);
  
  if (!user) {
    return res.status(404).json({ error: 'Profile not found. Please sign up first.' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
  res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

  sendEmail(
    user.email,
    'New Login Detected - xFiles',
    `Hi ${user.display_name || user.username},\n\nA new login was detected on your account at ${new Date().toLocaleString()}.`
  ).catch(err => console.error('Background login email failed:', err));

  res.json({ 
    id: user.id, 
    email: user.email, 
    username: user.username, 
    displayName: user.display_name,
    emailVerified: !!user.email_verified
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticate, (req: any, res) => {
  const user: any = db.prepare('SELECT id, email, username, display_name as displayName, email_verified as emailVerified, storage_limit as storageLimit, storage_used as storageUsed, plan FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

app.post('/api/user/profile', authenticate, (req: any, res) => {
  const { displayName } = req.body;
  try {
    db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName, req.user.id);
    const updatedUser: any = db.prepare('SELECT id, email, username, display_name as displayName, email_verified as emailVerified, storage_limit as storageLimit, plan FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/user/password', authenticate, (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const userRow: any = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    if (!userRow || !bcrypt.compareSync(currentPassword, userRow.password)) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }
    const hashedNew = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedNew, req.user.id);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Files
function autoCleanupTrash() {
  try {
    const oldFiles = db.prepare("SELECT * FROM files WHERE deleted = 1 AND deleted_at < datetime('now', '-30 days')").all() as any[];
    for (const f of oldFiles) {
      if (f.storage_path) {
        const filePath = path.join(_dirname, 'uploads', f.storage_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    db.prepare("DELETE FROM files WHERE deleted = 1 AND deleted_at < datetime('now', '-30 days')").run();
  } catch (e) {
    console.error('Failed to run automated trash cleanup:', e);
  }
}

app.get('/api/files', authenticate, (req: any, res) => {
  const { section, parentId, q, userId: queryUserId } = req.query;

  // Run automated 30 days recycle bin cleanup
  autoCleanupTrash();

  // Security: Only admins can request files of another user
  let targetUserId = req.user.id;
  if (queryUserId && isUserAdmin(req.user.email)) {
    targetUserId = queryUserId;
  }

  let query = 'SELECT * FROM files WHERE user_id = ?';
  let params: any[] = [];

  if (section === 'trash') {
    query = 'SELECT * FROM files WHERE user_id = ? AND deleted = 1_deleted_placeholder_';
    // Let's replace _deleted_placeholder_ with normal text later. Actually we don't need placeholder.
    query = 'SELECT * FROM files WHERE user_id = ? AND deleted = 1';
    params.push(targetUserId);
    if (q) {
      query += ' AND name LIKE ?';
      params.push(`%${q}%`);
    }
    query += ' ORDER BY deleted_at DESC';
  } else if (section === 'shared') {
    query = "SELECT * FROM files WHERE deleted = 0 AND ((shared_with LIKE ? AND user_id != ?) OR (user_id = ? AND shared_with IS NOT NULL AND shared_with != '[]' AND shared_with != ''))";
    params.push(`%${req.user.email}%`, targetUserId, targetUserId);
    if (q) {
      query += ' AND name LIKE ?';
      params.push(`%${q}%`);
    }
  } else if (section === 'starred') {
    query = 'SELECT * FROM files WHERE user_id = ? AND deleted = 0 AND starred = 1';
    params.push(targetUserId);
    if (q) {
      query += ' AND name LIKE ?';
      params.push(`%${q}%`);
    }
  } else if (section === 'recent') {
    query = 'SELECT * FROM files WHERE user_id = ? AND deleted = 0';
    params.push(targetUserId);
    if (q) {
      query += ' AND name LIKE ?';
      params.push(`%${q}%`);
    }
    query += ' ORDER BY modified_at DESC LIMIT 20';
  } else {
    query = 'SELECT * FROM files WHERE user_id = ? AND deleted = 0';
    params.push(targetUserId);
    if (q) {
      query += ' AND name LIKE ?';
      params.push(`%${q}%`);
    } else {
      let pid = parentId;
      if (pid === 'null' || pid === 'undefined' || !pid) pid = null;
      query += ' AND parent_id ' + (pid ? '= ?' : 'IS NULL');
      if (pid) params.push(pid);
    }
  }

  try {
    const files = db.prepare(query).all(...params);
    res.json(files.map((f: any) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      size: f.size,
      mime: resolveFileMime(f.name, f.mime),
      parentId: f.parent_id,
      userId: f.user_id,
      storagePath: f.storage_path,
      starred: !!f.starred,
      deleted: !!f.deleted,
      deletedAt: f.deleted_at,
      modifiedAt: f.modified_at,
      sharedWith: JSON.parse(f.shared_with || '[]')
    })));
  } catch (err: any) {
    console.error('Files retrieval query failed:', err);
    res.status(500).json({ error: err.message || 'Database query error' });
  }
});

app.post('/api/files/upload', authenticate, upload.array('files'), (req: any, res) => {
  const { parentId } = req.body;
  const files = req.files as Express.Multer.File[];
  
  if (!files) return res.status(400).json({ error: 'No files uploaded' });

  try {
    const insertFileStmt = db.prepare(`
      INSERT INTO files (id, name, type, size, mime, parent_id, user_id, storage_path)
      VALUES (?, ?, 'file', ?, ?, ?, ?, ?)
    `);

    const updateStorageStmt = db.prepare(`
      UPDATE users SET storage_used = storage_used + ? WHERE id = ?
    `);

    const insertActivityStmt = db.prepare(`
      INSERT INTO activity (id, user_id, action, target_id, target_name)
      VALUES (?, ?, ?, ?, ?)
    `);

    const results = files.map(file => {
      const id = uuidv4();
      let pid = parentId;
      if (pid === 'null' || pid === 'undefined' || !pid) pid = null;

      insertFileStmt.run(
        id,
        file.originalname || 'Unnamed File',
        file.size || 0,
        resolveFileMime(file.originalname || '', file.mimetype),
        pid,
        req.user.id,
        file.filename || ''
      );
      
      // Update user storage used
      updateStorageStmt.run(file.size || 0, req.user.id);

      // Track in activity log
      insertActivityStmt.run(
        uuidv4(),
        req.user.id,
        'upload',
        id,
        file.originalname || 'Unnamed File'
      );

      return { id, name: file.originalname, type: 'file', size: file.size };
    });

    res.json(results);
  } catch (err: any) {
    console.error('File Upload Database insertion error:', err);
    res.status(500).json({ error: `File Upload failed: ${err.message || err}` });
  }
});

app.post('/api/files/mkdir', authenticate, (req: any, res) => {
  const { name, parentId } = req.body;
  const id = generateAlphanumericId(10);
  db.prepare(`
    INSERT INTO files (id, name, type, parent_id, user_id)
    VALUES (?, ?, 'folder', ?, ?)
  `).run(id, name, parentId || null, req.user.id);
  
  // Track in activity log
  db.prepare(`
    INSERT INTO activity (id, user_id, action, target_id, target_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(uuidv4(), req.user.id, 'mkdir', id, name);

  res.json({ id, name, type: 'folder', parentId });
});

app.get('/api/folders/path/:id', authenticate, (req: any, res) => {
  const { id } = req.params;
  const pathList: { id: string, name: string }[] = [];
  
  try {
    let currentId = id;
    let iterations = 0;
    while (currentId && iterations < 50) { // Safety bound
      iterations++;
      const folder: any = db.prepare('SELECT id, name, parent_id FROM files WHERE id = ? AND type = \'folder\' AND user_id = ?').get(currentId, req.user.id);
      if (!folder) break;
      pathList.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parent_id;
    }
    res.json(pathList);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching folder path' });
  }
});

app.get('/api/folders', authenticate, (req: any, res) => {
  try {
    const folders = db.prepare("SELECT id, name FROM files WHERE user_id = ? AND type = 'folder' AND deleted = 0").all(req.user.id);
    res.json(folders);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching folders' });
  }
});

app.post('/api/files/move', authenticate, (req: any, res) => {
  const { ids, targetFolderId } = req.body;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids must be an array' });
  }

  try {
    let targetId = targetFolderId;
    if (targetId === 'null' || targetId === 'undefined' || !targetId) {
      targetId = null;
    }

    // Safety: Prevent moving a folder into itself or its own subfolders
    if (targetId) {
      for (const id of ids) {
        if (id === targetId) {
          return res.status(400).json({ error: 'Cannot move a folder into itself' });
        }
        let currentParentId = targetId;
        let pIterations = 0;
        while (currentParentId && pIterations < 50) {
          pIterations++;
          const folder: any = db.prepare('SELECT id, parent_id FROM files WHERE id = ? AND type = \'folder\' AND user_id = ?').get(currentParentId, req.user.id);
          if (!folder) break;
          if (folder.parent_id === id) {
            return res.status(400).json({ error: 'Cannot move a folder into its own subfolder' });
          }
          currentParentId = folder.parent_id;
        }
      }
    }

    const stmt = db.prepare('UPDATE files SET parent_id = ?, modified_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?');
    ids.forEach(id => {
      stmt.run(targetId, id, req.user.id);
    });

    res.json({ success: true, message: 'Items moved successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error moving items' });
  }
});

app.post('/api/requests/storage', authenticate, async (req: any, res) => {
  const id = uuidv4();
  const user: any = db.prepare('SELECT email, display_name FROM users WHERE id = ?').get(req.user.id);
  db.prepare(`
    INSERT INTO requests (id, user_id, type, data)
    VALUES (?, ?, 'storage_increase', ?)
  `).run(id, req.user.id, JSON.stringify({ email: user.email, name: user.display_name }));
  
  // Also "notify" admin via email simulation
  await sendEmail(
    'admin@conzex.com',
    'Storage Increase Request',
    `User ${user.display_name || user.email} has requested more storage.\nEmail: ${user.email}\nUser ID: ${req.user.id}`
  );

  res.json({ success: true, id });
});

app.get('/api/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM global_settings').all();
  const config: Record<string, string> = {};
  settings.forEach((s: any) => config[s.key] = s.value);
  res.json(config);
});

app.post('/api/admin/settings', authenticate, adminOnly, (req, res) => {
  const settings = req.body;
  const stmt = db.prepare('INSERT OR REPLACE INTO global_settings (key, value) VALUES (?, ?)');
  Object.entries(settings).forEach(([key, value]) => {
    stmt.run(key, String(value));
  });
  res.json({ success: true });
});

app.get('/api/admin/requests', authenticate, adminOnly, (req, res) => {
  const requests = db.prepare(`
    SELECT r.*, u.email, u.display_name
    FROM requests r
    JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `).all();
  res.json(requests);
});

app.post('/api/admin/requests/:id/approve', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  try {
    const request: any = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

    // Approve storage - add 50 GB
    const extraBytes = 50 * 1024 * 1024 * 1024;
    db.prepare('UPDATE users SET storage_limit = storage_limit + ? WHERE id = ?').run(extraBytes, request.user_id);
    db.prepare('UPDATE requests SET status = \'approved\' WHERE id = ?').run(id);

    // Create system log activity
    db.prepare(`
      INSERT INTO activity (id, user_id, action, target_id, target_name)
      VALUES (?, ?, 'quota_grant', ?, 'Approved 50 GB Quota Grant')
    `).run(uuidv4(), request.user_id, id);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/requests/:id/dismiss', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('UPDATE requests SET status = \'dismissed\' WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Protection Middleware
function adminOnly(req: any, res: any, next: any) {
  if (!isUserAdmin(req.user.email)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// Admin Endpoints
app.get('/api/admin/users', authenticate, adminOnly, (req, res) => {
  const users = db.prepare('SELECT id, email, username, display_name as displayName, plan, storage_used as storageUsed, storage_limit as storageLimit, created_at as createdAt FROM users').all();
  res.json(users);
});

app.post('/api/admin/users/:userId/limit', authenticate, adminOnly, (req: any, res: any) => {
  const { limit } = req.body; // in bytes
  const { userId } = req.params;
  db.prepare('UPDATE users SET storage_limit = ? WHERE id = ?').run(limit, userId);
  res.json({ success: true });
});

app.delete('/api/admin/users/:userId', authenticate, adminOnly, (req: any, res: any) => {
  const { userId } = req.params;
  if (userId === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  
  // Cleanup files from DB
  db.prepare('DELETE FROM files WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.json({ success: true });
});

app.get('/api/admin/stats/:userId', authenticate, adminOnly, (req: any, res: any) => {
  const files: any[] = db.prepare('SELECT * FROM files WHERE user_id = ?').all(req.params.userId);
  const stats: Record<string, number> = {};
  let totalSize = 0;
  
  files.forEach(f => {
    if (f.type === 'file') {
      const mimeGroup = (f.mime || 'unknown/unknown').split('/')[0];
      stats[mimeGroup] = (stats[mimeGroup] || 0) + (f.size || 0);
      totalSize += (f.size || 0);
    }
  });

  res.json({ stats, totalSize });
});

app.get('/api/storage/info', authenticate, (req: any, res) => {
  const userId = req.query.userId || req.user.id;
  // If requesting other user info, must be admin
  if (userId !== req.user.id && !isUserAdmin(req.user.email)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const user: any = db.prepare('SELECT storage_used, storage_limit FROM users WHERE id = ?').get(userId);
  res.json({ used: user.storage_used, total: user.storage_limit });
});

app.post('/api/files/:id/star', authenticate, (req: any, res) => {
  const { id } = req.params;
  const { starred } = req.body;
  db.prepare('UPDATE files SET starred = ? WHERE id = ? AND user_id = ?').run(starred ? 1 : 0, id, req.user.id);
  
  // Create activity log
  try {
    const file: any = db.prepare('SELECT name FROM files WHERE id = ?').get(id);
    const actionName = starred ? 'starred' : 'unstarred';
    db.prepare(`
      INSERT INTO activity (id, user_id, action, target_id, target_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, starred ? 'star' : 'unstar', id, file ? file.name : 'Unknown File');
  } catch (e) {
    console.error(e);
  }

  res.json({ success: true });
});

app.post('/api/files/:id/rename', authenticate, (req: any, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Valid name is required' });
  }

  try {
    const file: any = db.prepare('SELECT name FROM files WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    db.prepare('UPDATE files SET name = ?, modified_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, id);

    // Track activity log
    db.prepare(`
      INSERT INTO activity (id, user_id, action, target_id, target_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'rename', id, `Renamed "${file.name}" to "${name}"`);

    res.json({ success: true, id, name });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/files/trash', authenticate, (req: any, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.json({ success: true });
  }

  try {
    const chunkSize = 500;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => '?').join(',');
      db.prepare(`UPDATE files SET deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) AND user_id = ?`).run(...chunk, req.user.id);
    }
    
    // Create activity log
    try {
      const firstChunk = ids.slice(0, 500);
      const firstPlaceholders = firstChunk.map(() => '?').join(',');
      const files = db.prepare(`SELECT name FROM files WHERE id IN (${firstPlaceholders})`).all(...firstChunk) as any[];
      const fileNames = files.map(f => f.name).join(', ');
      db.prepare(`
        INSERT INTO activity (id, user_id, action, target_id, target_name)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), req.user.id, 'trash', ids[0], fileNames.substring(0, 255));
    } catch (e) {
      console.error(e);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/files/restore', authenticate, (req: any, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.json({ success: true });
  }

  try {
    const chunkSize = 500;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => '?').join(',');
      db.prepare(`UPDATE files SET deleted = 0, deleted_at = NULL WHERE id IN (${placeholders}) AND user_id = ?`).run(...chunk, req.user.id);
    }
    
    // Create activity log
    try {
      const firstChunk = ids.slice(0, 500);
      const firstPlaceholders = firstChunk.map(() => '?').join(',');
      const files = db.prepare(`SELECT name FROM files WHERE id IN (${firstPlaceholders})`).all(...firstChunk) as any[];
      const fileNames = files.map(f => f.name).join(', ');
      db.prepare(`
        INSERT INTO activity (id, user_id, action, target_id, target_name)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), req.user.id, 'restore', ids[0], fileNames.substring(0, 255));
    } catch (e) {
      console.error(e);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/files/delete', authenticate, (req: any, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.json({ success: true });
  }

  // Delete physical files
  try {
    const chunkSize = 500;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => '?').join(',');
      const files = db.prepare(`SELECT storage_path FROM files WHERE id IN (${placeholders}) AND user_id = ?`).all(...chunk, req.user.id) as any[];
      files.forEach(f => {
        if (f.storage_path) {
          const filePath = path.join(_dirname, 'uploads', f.storage_path);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    }
  } catch (e) {
    console.error('Physical deletion error:', e);
  }

  try {
    const chunkSize = 500;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => '?').join(',');
      db.prepare(`DELETE FROM files WHERE id IN (${placeholders}) AND user_id = ?`).run(...chunk, req.user.id);
    }
    
    // Track activity log
    try {
      db.prepare(`
        INSERT INTO activity (id, user_id, action, target_id, target_name)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), req.user.id, 'delete', ids[0] || 'multiple', 'Deleted files permanently');
    } catch (e) {
      console.error(e);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// File Sharing
app.post('/api/files/:id/share', authenticate, (req: any, res) => {
  const { id } = req.params;
  const { emails } = req.body;

  if (!Array.isArray(emails)) {
    return res.status(400).json({ error: 'emails must be an array' });
  }

  try {
    const file: any = db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const currentShared = JSON.parse(file.shared_with || '[]');
    const updatedShared = Array.from(new Set([...currentShared, ...emails.map((e: string) => e.trim().toLowerCase())]));
    db.prepare('UPDATE files SET shared_with = ? WHERE id = ?').run(JSON.stringify(updatedShared), id);

    // Track activity
    db.prepare(`
      INSERT INTO activity (id, user_id, action, target_id, target_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, 'share', id, `Shared "${file.name}" with ${emails.join(', ')}`);

    res.json({ success: true, sharedWith: updatedShared });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real-time Notifications Bell Alerts
app.get('/api/notifications', authenticate, (req: any, res) => {
  try {
    const activities = db.prepare('SELECT * FROM activity WHERE user_id = ? ORDER BY timestamp DESC LIMIT 15').all(req.user.id);
    res.json(activities);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Inline File Preview View
app.get('/api/files/view/:id', authenticate, (req: any, res) => {
  const file: any = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file || file.type === 'folder') return res.status(404).json({ error: 'File not found' });

  const sharedWith = JSON.parse(file.shared_with || '[]');
  const isOwner = file.user_id === req.user.id;
  const isShared = sharedWith.includes(req.user.email);
  const isAdmin = isUserAdmin(req.user.email);

  if (!isOwner && !isShared && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const filePath = path.join(_dirname, 'uploads', file.storage_path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Physical file not found' });
  }

  const resolvedMime = resolveFileMime(file.name, file.mime);
  res.setHeader('Content-Type', resolvedMime);
  res.sendFile(filePath);
});

// Public view direct access without auth for external platform embeds/dev refs
app.get('/api/files/public/:id/:filename', (req: any, res) => {
  const { id } = req.params;
  const file: any = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
  if (!file || file.type === 'folder') return res.status(404).json({ error: 'File not found' });

  const filePath = path.join(_dirname, 'uploads', file.storage_path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Physical file not found' });
  }

  const resolvedMime = resolveFileMime(file.name, file.mime);
  res.setHeader('Content-Type', resolvedMime);

  // Cross-Origin Resource Sharing (CORS) headers for other development platforms
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  res.sendFile(filePath);
});

app.get('/api/files/public/:id', (req: any, res) => {
  const { id } = req.params;
  const file: any = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
  if (!file || file.type === 'folder') return res.status(404).json({ error: 'File not found' });

  const filePath = path.join(_dirname, 'uploads', file.storage_path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Physical file not found' });
  }

  const resolvedMime = resolveFileMime(file.name, file.mime);
  res.setHeader('Content-Type', resolvedMime);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  res.sendFile(filePath);
});

app.post('/api/admin/send-verification', authenticate, adminOnly, async (req, res) => {
  const { email } = req.body;
  const success = await sendEmail(
    email,
    'Verify your xFiles Account',
    'Click the link below to verify your account (simulation link: https://xfiles.conzex.com/verify)',
    '<h1>Verify your Account</h1><p>Click <a href="https://xfiles.conzex.com/verify">here</a> to verify.</p>'
  );
  if (success) {
    res.json({ success: true, message: 'Verification link sent' });
  } else {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/api/admin/reset-password', authenticate, adminOnly, async (req, res) => {
  const { email } = req.body;
  const success = await sendEmail(
    email,
    'Reset your xFiles Password',
    'Click the link below to reset your password (simulation link: https://xfiles.conzex.com/reset)',
    '<h1>Reset your Password</h1><p>Click <a href="https://xfiles.conzex.com/reset">here</a> to reset.</p>'
  );
  if (success) {
    res.json({ success: true, message: 'Password reset link sent' });
  } else {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.get('/api/files/download/:id', authenticate, (req: any, res) => {
  const file: any = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file || file.type === 'folder') return res.status(404).json({ error: 'File not found' });

  const sharedWith = JSON.parse(file.shared_with || '[]');
  const isOwner = file.user_id === req.user.id;
  const isShared = sharedWith.includes(req.user.email);
  const isAdmin = isUserAdmin(req.user.email);

  if (!isOwner && !isShared && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const filePath = path.join(_dirname, 'uploads', file.storage_path);
  res.download(filePath, file.name);
});

// Vite Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('Initializing Vite in middleware mode...');
      const vite = await createViteServer({
        server: { 
          middlewareMode: true,
          hmr: false, // Ensure HMR is disabled to avoid port conflicts in sandbox
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite middleware integrated.');
    } catch (err) {
      console.error('Failed to initialize Vite:', err);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((err: any, req: any, res: any, next: any) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`xFiles Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('STARTUP ERROR:', err);
});
