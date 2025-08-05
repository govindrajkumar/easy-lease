const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Firebase client SDK (used on the server for Firestore access)
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || 'secret123';

app.use(cors());
app.use(express.json());

// Firebase configuration copied from the front-end firebase.js file
const firebaseConfig = {
  apiKey: "AIzaSyDH-9HMnMIMnpP7JT3HwODG1cZRrFTr-Ko",
  authDomain: "easylease-sgaap.firebaseapp.com",
  projectId: "easylease-sgaap",
  storageBucket: "easylease-sgaap.firebasestorage.app",
  messagingSenderId: "1097212604433",
  appId: "1:1097212604433:web:b9179f3228068f5d3a01b0",
  measurementId: "G-0HXJV0VGHS",
};

// Initialize Firebase for server-side usage
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Authenticate user against Firebase Auth and retrieve role from Firestore
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verify email/password with Firebase Auth REST API
    const authRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
        agent: process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy) : undefined,
      }
    );

    if (!authRes.ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const authData = await authRes.json();
    const uid = authData.localId;

    // Fetch additional user info from Firestore
    const docRef = doc(db, 'Users', uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    const userData = docSnap.data();

    const token = await new Promise((resolve, reject) => {
      jwt.sign(
        { email: userData.email || email, role: userData.role, first_name: userData.first_name },
        SECRET_KEY,
        { expiresIn: '1h' },
        (err, generated) => {
          if (err) {
            reject(err);
          } else {
            resolve(generated);
          }
        }
      );
    });

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
