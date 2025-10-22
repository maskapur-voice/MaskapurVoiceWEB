require('dotenv').config({ path: './enviroment.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Twilio = require('twilio');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Config ---
const PORT = process.env.PORT || 5000;
const OTP_EXP_MINUTES = 5; // OTP expiry
const MAX_ATTEMPTS = 5; // max wrong attempts
const JWT_SECRET = process.env.OTP_SECRET || crypto.randomBytes(32).toString('hex');

// Initialize Twilio client (if credentials provided)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// In-memory store fallback (for demo); can swap with Redis if REDIS_URL present

const otpStore = new Map();

function generateOtp(length = 6) {
  // Numeric OTP of given length
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

function sendOtpSms(mobile, code) {
  if (!twilioClient) {
    console.log(`[DEV] Pretend sending OTP ${code} to ${mobile}`);
    return Promise.resolve({ sid: 'DEV_LOCAL', preview: true });
  }
  return twilioClient.messages.create({
    body: `Your verification code is ${code}. It expires in ${OTP_EXP_MINUTES} minutes.`,
    from: process.env.TWILIO_PHONE,
    to: mobile
  });
}

app.post('/auth/send-otp', async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || !/^\+?[1-9]\d{7,14}$/.test(mobile)) {
      return res.status(400).json({ error: 'Invalid mobile format' });
    }

    const existing = otpStore.get(mobile);
    const now = Date.now();
    if (existing) {
      // If within 60s of last creation, block resend
      if (now - existing.createdAt < 60 * 1000) {
        return res.status(429).json({ error: 'Please wait before requesting another OTP.' });
      }
      // If still valid and beyond 60s, reuse same code and resend
      if (existing.expiresAt > now) {
        existing.createdAt = now; // update timestamp for rate limiting
        await sendOtpSms(mobile, existing.code);
        return res.json({ success: true, message: 'OTP re-sent (same code still valid).' });
      }
    }

    const code = generateOtp(6);
    const expiresAt = now + OTP_EXP_MINUTES * 60 * 1000;
    otpStore.set(mobile, { code, expiresAt, attempts: 0, createdAt: now });

    await sendOtpSms(mobile, code);
    return res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('[send-otp error]', err.message, err.stack);
    return res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }
});

app.post('/auth/verify', (req, res) => {
  const { mobile, code } = req.body;
  if (!mobile || !code) return res.status(400).json({ error: 'Missing mobile or code' });

  const entry = otpStore.get(mobile);
  if (!entry) return res.status(400).json({ error: 'No OTP requested for this mobile' });

  const now = Date.now();
  if (entry.expiresAt < now) {
    otpStore.delete(mobile);
    return res.status(410).json({ error: 'OTP expired' });
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(mobile);
    return res.status(429).json({ error: 'Too many attempts' });
  }

  if (entry.code !== code) {
    entry.attempts += 1;
    return res.status(401).json({ error: 'Incorrect code', attemptsLeft: MAX_ATTEMPTS - entry.attempts });
  }

  // Success
  otpStore.delete(mobile); // consume OTP
  const token = jwt.sign({ mobile }, JWT_SECRET, { expiresIn: '1h' });
  return res.json({ success: true, token });
});

// Resend endpoint: Enforces 60s cooldown; if OTP expired generate new
app.post('/auth/resend', async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || !/^\+?[1-9]\d{7,14}$/.test(mobile)) {
      return res.status(400).json({ error: 'Invalid mobile format' });
    }
    const entry = otpStore.get(mobile);
    const now = Date.now();
    if (!entry) {
      return res.status(404).json({ error: 'No OTP session to resend; request a new OTP.' });
    }
    if (now - entry.createdAt < 60 * 1000) {
      return res.status(429).json({ error: 'Please wait before resending.' });
    }
    let reused = true;
    if (entry.expiresAt < now) {
      // expired -> new code
      const code = generateOtp(6);
      entry.code = code;
      entry.expiresAt = now + OTP_EXP_MINUTES * 60 * 1000;
      reused = false;
    }
    entry.createdAt = now;
    await sendOtpSms(mobile, entry.code);
    return res.json({ success: true, message: 'OTP resent', reused, expiresInSec: Math.floor((entry.expiresAt - now)/1000) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

app.get('/auth/health', (req, res) => res.json({ status: 'ok' }));

// SOS Photo endpoint
app.post('/sos/save-photo', async (req, res) => {
  try {
    const { photo, filename, timestamp } = req.body;
    
    if (!photo || !filename) {
      return res.status(400).json({ error: 'Missing photo or filename' });
    }

    // Create sos-photos directory if it doesn't exist
    const sosDir = path.join(__dirname, 'sos-photos');
    if (!fs.existsSync(sosDir)) {
      fs.mkdirSync(sosDir, { recursive: true });
    }

    // Extract base64 data (remove data:image/jpeg;base64, prefix)
    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Save photo to file
    const filepath = path.join(sosDir, filename);
    fs.writeFileSync(filepath, buffer);

    console.log(`[SOS] Photo saved: ${filename} at ${timestamp}`);
    
    // Also save metadata
    const metadataPath = path.join(sosDir, 'sos-log.json');
    let logs = [];
    if (fs.existsSync(metadataPath)) {
      logs = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }
    logs.push({ filename, timestamp, savedAt: new Date().toISOString() });
    fs.writeFileSync(metadataPath, JSON.stringify(logs, null, 2));

    return res.json({ success: true, message: 'Photo saved', filename });
  } catch (error) {
    console.error('[SOS] Photo save error:', error);
    return res.status(500).json({ error: 'Failed to save photo' });
  }
});

// Root landing route
app.get('/', (req, res) => {
  res.json({ service: 'otp-auth-backend', endpoints: ['/auth/send-otp', '/auth/verify', '/auth/health', '/sos/save-photo'] });
});

app.listen(PORT, () => console.log(`OTP auth server running on port ${PORT}`));

module.exports = app;