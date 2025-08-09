const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory stores for demo purposes
const users = [];
const refreshTokens = [];

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret';
const TOKEN_EXPIRY = '15m';

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  refreshTokens.push(refreshToken);
  return { accessToken, refreshToken };
}

app.post('/auth/register', async (req, res) => {
  const { email, password, role } = req.body;
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ message: 'User exists' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), email, role, password: hashed };
  users.push(user);
  const tokens = generateTokens(user);
  res.json({ token: tokens.accessToken, refreshToken: tokens.refreshToken });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: 'Invalid credentials' });
  const tokens = generateTokens(user);
  res.json({ token: tokens.accessToken, refreshToken: tokens.refreshToken });
});

app.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || !refreshTokens.includes(refreshToken)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    refreshTokens.splice(refreshTokens.indexOf(refreshToken), 1);
    const user = users.find((u) => u.id === payload.id);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    const tokens = generateTokens(user);
    res.json({ token: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
});

app.listen(4000, () => console.log('Auth server running on port 4000'));
