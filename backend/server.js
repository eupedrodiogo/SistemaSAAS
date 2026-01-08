
/**
 * TRG Nexus - Backend Server
 * 
 * INSTRUÇÕES DE USO:
 * 1. Crie uma pasta 'backend'
 * 2. Instale dependências: npm init -y && npm install express cors body-parser jsonwebtoken
 * 3. Rode o servidor: node server.js
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = 'trg-nexus-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- MOCK DATABASE (In-Memory for demo purposes) ---
// Em produção, substitua por MongoDB, PostgreSQL, etc.

let users = [
  { id: '1', email: 'admin@trgnexus.com', password: '123', name: 'Dr. Ricardo' }
];

let patients = [
  { 
    id: '1', 
    name: 'Ana Silva', 
    email: 'ana.silva@email.com', 
    phone: '(11) 99887-6655', 
    status: 'Ativo', 
    lastSession: '2023-10-18',
    createdAt: new Date().toISOString()
  }
];

let sessions = [];

// --- MIDDLEWARES ---

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token não fornecido' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};

// --- ROUTES ---

// 1. Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '8h' });
    res.json({ token, user: { name: user.name, email: user.email } });
  } else {
    res.status(401).json({ message: 'Credenciais inválidas' });
  }
});

// 2. Patients (CRUD)
app.get('/api/patients', authenticate, (req, res) => {
  res.json(patients);
});

app.post('/api/patients', authenticate, (req, res) => {
  const newPatient = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  patients.push(newPatient);
  res.status(201).json(newPatient);
});

app.put('/api/patients/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const index = patients.findIndex(p => p.id === id);
  if (index !== -1) {
    patients[index] = { ...patients[index], ...req.body };
    res.json(patients[index]);
  } else {
    res.status(404).json({ message: 'Paciente não encontrado' });
  }
});

app.delete('/api/patients/:id', authenticate, (req, res) => {
  const { id } = req.params;
  patients = patients.filter(p => p.id !== id);
  res.json({ success: true });
});

// 3. Sessions (TRG Protocols)
app.post('/api/sessions', authenticate, (req, res) => {
  const sessionData = {
    id: Date.now().toString(),
    therapistId: req.user.id,
    date: new Date().toISOString(),
    ...req.body
  };
  sessions.push(sessionData);
  res.status(201).json(sessionData);
});

app.get('/api/sessions/:patientId', authenticate, (req, res) => {
  const patientSessions = sessions.filter(s => s.patientId === req.params.patientId);
  res.json(patientSessions);
});

// 4. Dashboard Stats
app.get('/api/dashboard/stats', authenticate, (req, res) => {
  res.json({
    activePatients: patients.filter(p => p.status === 'Ativo').length,
    totalSessions: sessions.length,
    revenue: 12500.00, // Mock calculation
    productivity: 94
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`TRG Nexus Server running on port ${PORT}`);
});
