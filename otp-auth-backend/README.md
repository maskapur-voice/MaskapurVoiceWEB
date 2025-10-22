# OTP Auth Backend

Express-based backend for sending and verifying OTP codes via Twilio.

## Prerequisites
- Node.js 18+
- Twilio account & SMS capable phone number
- (Optional) Redis instance if you want persistence beyond in-memory

## Environment Variables (`enviroment.env`)
Rotate any real secrets you have already committed. NEVER commit live secrets. Example safe template:
```
PORT=5000
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE=+1234567890
OTP_SECRET=a_long_random_string_for_jwt
REDIS_URL=redis://localhost:6379
```

## Install & Run
From the `otp-auth-backend` directory:
```
npm install
npm run dev
```
Server listens on `http://localhost:5000`.

## API
### POST /auth/send-otp
Body: `{ "mobile": "+15551234567" }`
Response: `{ success: true, message: "OTP sent" }`
Errors: `400 Invalid mobile`, `429 rate limited`, `500 send failure`.

### POST /auth/verify
Body: `{ "mobile": "+15551234567", "code": "123456" }`
Success: `{ success: true, token: "<JWT>" }`
Errors: `400 no OTP`, `410 expired`, `401 incorrect`, `429 too many attempts`.

## Notes
- OTP expires in 5 minutes.
- Max wrong attempts: 5 then OTP invalidated.
- JWT expires in 1 hour.
- For production, replace in-memory store with Redis and add stronger rate limiting per IP/mobile.
- Consider using Twilio Verify Service for automatic code management (simplifies logic).

## Security
- Rotate secrets that were committed.
- Prefer storing JWT in HttpOnly cookie rather than localStorage for production.
- Add request throttling (e.g., express-rate-limit) before deployment.

## Replace In-Memory With Redis (Optional)
Implement simple wrapper using `redis` dependency:
```js
// After creating redis client
await client.setEx(`otp:${mobile}`, OTP_EXP_MINUTES*60, JSON.stringify({ code, createdAt: Date.now() }));
```

## License
ISC
