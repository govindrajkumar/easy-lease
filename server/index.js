const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || 'secret123';

app.use(cors());
app.use(express.json());

const users = [
  { id: 1, email: 'tenant@example.com', password: 'tenantpass', role: 'tenant', first_name: 'Tenant' },
  { id: 2, email: 'landlord@example.com', password: 'landlordpass', role: 'landlord', first_name: 'Landlord' }
];

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

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ email: user.email, role: user.role, first_name: user.first_name }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

app.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
