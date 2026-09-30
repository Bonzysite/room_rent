import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DatabaseSchema, Room, RoomApplication, Conversation, Message, User } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Architecture PDF download endpoint (Section 6)
app.get('/website-structure.pdf', (_req, res) => {
  const pdfPath = path.join(__dirname, 'public', 'website-structure.pdf');
  if (fs.existsSync(pdfPath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="website-structure.pdf"');
    return res.sendFile(pdfPath);
  }
  res.status(404).json({ success: false, message: 'PDF file not found' });
});

// Helper to read DB
function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = { users: [], rooms: [], applications: [], conversations: [], messages: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { users: [], rooms: [], applications: [], conversations: [], messages: [] };
  }
}

// Helper to write DB
function writeDb(data: DatabaseSchema): void {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

/* ==========================================================================
   REST API Endpoints as specified in Blueprint Section 6
   ========================================================================== */

// 1. GET /api/data - Full database bootstrap snapshot
app.get('/api/data', (_req, res) => {
  const db = readDb();
  res.json({ success: true, data: db });
});

// 2. POST /api/sync - Bidirectional synchronization
app.post('/api/sync', (req, res) => {
  const clientData: Partial<DatabaseSchema> = req.body;
  const currentDb = readDb();

  // Merge items by id
  if (clientData.rooms && Array.isArray(clientData.rooms)) {
    const map = new Map<string, Room>(currentDb.rooms.map(r => [r.id, r]));
    clientData.rooms.forEach(r => map.set(r.id, r));
    currentDb.rooms = Array.from(map.values());
  }

  if (clientData.applications && Array.isArray(clientData.applications)) {
    const map = new Map<string, RoomApplication>(currentDb.applications.map(a => [a.id, a]));
    clientData.applications.forEach(a => map.set(a.id, a));
    currentDb.applications = Array.from(map.values());
  }

  if (clientData.conversations && Array.isArray(clientData.conversations)) {
    const map = new Map<string, Conversation>(currentDb.conversations.map(c => [c.id, c]));
    clientData.conversations.forEach(c => map.set(c.id, c));
    currentDb.conversations = Array.from(map.values());
  }

  if (clientData.messages && Array.isArray(clientData.messages)) {
    const map = new Map<string, Message>(currentDb.messages.map(m => [m.id, m]));
    clientData.messages.forEach(m => map.set(m.id, m));
    currentDb.messages = Array.from(map.values());
  }

  if (clientData.users && Array.isArray(clientData.users)) {
    const map = new Map<string, User>(currentDb.users.map(u => [u.id, u]));
    clientData.users.forEach(u => map.set(u.id, u));
    currentDb.users = Array.from(map.values());
  }

  writeDb(currentDb);
  res.json({ success: true, data: currentDb });
});

// 3. GET /api/rooms - List all rooms
app.get('/api/rooms', (req, res) => {
  const db = readDb();
  let rooms = db.rooms;

  const { city, roomType, maxPrice, billsIncluded } = req.query;
  if (city) {
    rooms = rooms.filter(r => r.city.toLowerCase() === String(city).toLowerCase());
  }
  if (roomType) {
    rooms = rooms.filter(r => r.roomType === roomType);
  }
  if (maxPrice) {
    rooms = rooms.filter(r => r.price <= Number(maxPrice));
  }
  if (billsIncluded === 'true') {
    rooms = rooms.filter(r => r.billsIncluded);
  }

  res.json({ success: true, count: rooms.length, data: rooms });
});

// 4. POST /api/rooms - Create room listing
app.post('/api/rooms', (req, res) => {
  const db = readDb();
  const newRoom: Room = {
    ...req.body,
    id: req.body.id || `room-${Date.now()}`,
    createdAt: req.body.createdAt || new Date().toISOString(),
    status: req.body.status || 'active',
  };

  db.rooms.unshift(newRoom);
  writeDb(db);
  res.status(201).json({ success: true, data: newRoom });
});

// 5. PUT /api/rooms/:id - Update room
app.put('/api/rooms/:id', (req, res) => {
  const db = readDb();
  const index = db.rooms.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  db.rooms[index] = { ...db.rooms[index], ...req.body };
  writeDb(db);
  res.json({ success: true, data: db.rooms[index] });
});

// 6. DELETE /api/rooms/:id - Delete room
app.delete('/api/rooms/:id', (req, res) => {
  const db = readDb();
  const exists = db.rooms.some(r => r.id === req.params.id);
  if (!exists) {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }

  db.rooms = db.rooms.filter(r => r.id !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: 'Room deleted successfully' });
});

// 7. GET /api/users - Fetch users
app.get('/api/users', (req, res) => {
  const db = readDb();
  const { email } = req.query;
  if (email) {
    const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
    return res.json({ success: true, data: user || null });
  }
  res.json({ success: true, data: db.users });
});

// GET /api/users/:id - Get user profile by ID
app.get('/api/users/:id', (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, data: user });
});

// 8. POST /api/users - Register or login
app.post('/api/users', (req, res) => {
  const db = readDb();
  const { email, name, role, phone, bio } = req.body;

  let existing = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) {
    return res.json({ success: true, user: existing, message: 'Existing session loaded' });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: name || email.split('@')[0],
    email: email.toLowerCase(),
    role: role || 'tenant',
    phone: phone || '',
    bio: bio || '',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDb(db);
  res.status(201).json({ success: true, user: newUser, message: 'Registered successfully' });
});

// 9. PUT /api/users/:id - Update profile
app.put('/api/users/:id', (req, res) => {
  const db = readDb();
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  db.users[index] = { ...db.users[index], ...req.body };
  writeDb(db);
  res.json({ success: true, user: db.users[index] });
});

// 10. GET /api/applications - List applications
app.get('/api/applications', (req, res) => {
  const db = readDb();
  const { landlordId, tenantId } = req.query;
  let apps = db.applications;

  if (landlordId) {
    apps = apps.filter(a => a.landlordId === landlordId);
  }
  if (tenantId) {
    apps = apps.filter(a => a.tenantId === tenantId);
  }

  res.json({ success: true, count: apps.length, data: apps });
});

// 11. POST /api/applications - Submit application
app.post('/api/applications', (req, res) => {
  const db = readDb();
  const newApp: RoomApplication = {
    ...req.body,
    id: `app-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  db.applications.unshift(newApp);
  writeDb(db);
  res.status(201).json({ success: true, data: newApp });
});

// 12. PUT /api/applications/:id - Update application status
app.put('/api/applications/:id', (req, res) => {
  const db = readDb();
  const index = db.applications.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  db.applications[index] = { ...db.applications[index], ...req.body };
  writeDb(db);
  res.json({ success: true, data: db.applications[index] });
});

// 13. GET & POST /api/conversations & /api/messages
app.get('/api/conversations', (req, res) => {
  const db = readDb();
  const { userId } = req.query;
  let convs = db.conversations;

  if (userId) {
    convs = convs.filter(c => c.participants.includes(String(userId)));
  }

  res.json({ success: true, data: convs });
});

app.post('/api/conversations', (req, res) => {
  const db = readDb();
  const { participants, roomId, initialMessage, senderName } = req.body;

  // Look for existing conversation between same participants and room
  let conv = db.conversations.find(c => 
    c.roomId === roomId &&
    participants.every((p: string) => c.participants.includes(p))
  );

  if (!conv) {
    conv = {
      id: `conv-${Date.now()}`,
      participants,
      roomId,
      lastMessage: initialMessage || 'Conversation started',
      updatedAt: new Date().toISOString()
    };
    db.conversations.unshift(conv);
  } else if (initialMessage) {
    conv.lastMessage = initialMessage;
    conv.updatedAt = new Date().toISOString();
  }

  if (initialMessage) {
    const msg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: conv.id,
      senderId: participants[0],
      senderName: senderName || 'User',
      text: initialMessage,
      timestamp: new Date().toISOString(),
      read: false
    };
    db.messages.push(msg);
  }

  writeDb(db);
  res.status(201).json({ success: true, data: conv });
});

app.get('/api/messages', (req, res) => {
  const db = readDb();
  const { conversationId } = req.query;
  let msgs = db.messages;

  if (conversationId) {
    msgs = msgs.filter(m => m.conversationId === conversationId);
  }

  res.json({ success: true, data: msgs });
});

app.post('/api/messages', (req, res) => {
  const db = readDb();
  const { conversationId, senderId, senderName, text } = req.body;

  const msg: Message = {
    id: `msg-${Date.now()}`,
    conversationId,
    senderId,
    senderName,
    text,
    timestamp: new Date().toISOString(),
    read: false
  };

  db.messages.push(msg);

  // Update conversation
  const conv = db.conversations.find(c => c.id === conversationId);
  if (conv) {
    conv.lastMessage = text;
    conv.updatedAt = msg.timestamp;
  }

  writeDb(db);
  res.status(201).json({ success: true, data: msg });
});

app.listen(PORT, () => {
  console.log(`[RoomShare Backend] REST API server running at http://localhost:${PORT}`);
});
