const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Twilio client
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Temporary OTP store (use Redis or DB in production)
const otpStore = new Map();

// Serve static files from the Angular app
app.use(express.static(path.join(__dirname, 'dist/maskapur-voice')));

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore.set(phone, otp);

    await client.messages.create({
      body: `Your verification code is ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: phone
    });

    console.log(`✅ OTP sent to ${phone}: ${otp}`);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// Verify OTP endpoint
app.post('/api/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  const storedOtp = otpStore.get(phone);

  if (storedOtp && storedOtp == otp) {
    otpStore.delete(phone);

    // Generate JWT token
    const token = jwt.sign({ phone }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } else {
    res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }
});

// All other routes should be redirected to the Angular app
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist/maskapur-voice/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 Server running on http://localhost:' + PORT);
});