const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || 'secret123';

app.use(cors());
app.use(express.json());

const firebaseConfig = {
  apiKey: "AIzaSyDH-9HMnMIMnpP7JT3HwODG1cZRrFTr-Ko",
  projectId: "easylease-sgaap",
};

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
}

async function signInWithPassword(email, password) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!res.ok) {
    throw new Error('Auth failed');
  }
  return res.json();
}

async function fetchUser(uid, idToken) {
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/Users/${uid}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) {
    throw new Error('User profile not found');
  }
  return res.json();
}

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const loginData = await signInWithPassword(email, password);
    const { localId: uid, idToken } = loginData;
    const userDoc = await fetchUser(uid, idToken);
    const fields = userDoc.fields || {};
    const role = fields.role?.stringValue || '';
    const firstName = fields.first_name?.stringValue || '';

    const token = jwt.sign({ email, role, first_name: firstName }, SECRET_KEY, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
