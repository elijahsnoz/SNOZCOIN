const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files (for local dev)
app.use('/', express.static(path.resolve(__dirname, '..')));

// In-memory sample data (replace with persistent DB in production)
const creators = [
  { slug: 'luna-arts', name: 'Luna Arts', bio: 'Digital painter and animator.', unlockables: [{id:'u1',title:'Behind the Scenes Pack',description:'High-res files and process videos',price:5}], activity:[{type:'Tip',note:'Received 3 tips today'}]},
  { slug: 'beatforge', name: 'BeatForge', bio: 'Electronic music producer.', unlockables: [{id:'u2',title:'Sample Pack Vol.1',description:'Exclusive samples for producers',price:3}], activity:[{type:'Tip',note:'Live show tips incoming'}]},
];

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 540;
const MAX_PLAYERS_PER_ROOM = 40;
const MAX_ROOMS = 100;
const rooms = new Map();

function cleanText(value, fallback, maxLength) {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLength);
  return cleaned || fallback;
}

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    if (rooms.size >= MAX_ROOMS) return null;
    rooms.set(roomId, new Map());
  }
  return rooms.get(roomId);
}

function publicPlayer(player) {
  return { id: player.id, name: player.name, x: player.x, y: player.y, color: player.color };
}

function broadcast(room, message) {
  const encoded = JSON.stringify(message);
  for (const player of room.values()) {
    if (player.socket.readyState === player.socket.OPEN) player.socket.send(encoded);
  }
}

function leaveWorld(player) {
  if (!player.room) return;
  const room = rooms.get(player.room);
  if (!room) return;
  room.delete(player.id);
  broadcast(room, { type: 'player-left', id: player.id });
  if (room.size === 0) rooms.delete(player.room);
  player.room = null;
}

function joinWorld(player, requestedRoom) {
  const roomId = cleanText(requestedRoom, 'central-plaza', 32).toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  const room = getRoom(roomId);
  if (!room) return { error: 'This world is full. Try again shortly.' };
  if (room.size >= MAX_PLAYERS_PER_ROOM) return { error: 'This room is full. Choose another room.' };
  leaveWorld(player);
  player.room = roomId;
  player.x = 120 + Math.floor(Math.random() * 720);
  player.y = 120 + Math.floor(Math.random() * 300);
  room.set(player.id, player);
  player.socket.send(JSON.stringify({
    type: 'world-state',
    room: roomId,
    self: publicPlayer(player),
    players: [...room.values()].map(publicPlayer)
  }));
  broadcast(room, { type: 'player-joined', player: publicPlayer(player) });
  return null;
}

app.get('/api/creators', (req,res)=>{
  res.json(creators.map(c=>({slug:c.slug,name:c.name,bio:c.bio}))); 
});

app.get('/api/creator/:slug', (req,res)=>{
  const c = creators.find(x=>x.slug===req.params.slug);
  if(!c) return res.status(404).json({message:'Not found'});
  res.json(c);
});

// Endpoint: verify an unlock purchase by txHash and return a signed URL
app.post('/api/unlock/verify', (req,res)=>{
  const {slug, assetId, txHash} = req.body || {};
  if(!slug || !assetId || !txHash) return res.status(400).json({message:'Missing parameters'});

  // In a real system: verify txHash on-chain (indexer) that it sent the required amount
  // Here we accept any txHash for demo and return a signed URL with short expiry

  const token = crypto.randomBytes(18).toString('hex');
  const signedUrl = `${req.protocol}://${req.get('host')}/assets/sample-unlocked-content.pdf?token=${token}`;

  // In production, store token with expiry and validate when serving the asset
  return res.json({signedUrl});
});

// Example endpoint to exchange a token for content (not secure — demo only)
app.get('/assets/sample-unlocked-content.pdf', (req,res)=>{
  // In production validate req.query.token against DB and expiry
  // Here we just return a placeholder file if present in assets folder
  const filePath = path.resolve(__dirname, '..', 'assets', 'SNOZCOIN_whitepaper.pdf');
  res.sendFile(filePath);
});

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const worldSocket = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  if (request.url !== '/world') {
    socket.destroy();
    return;
  }
  worldSocket.handleUpgrade(request, socket, head, (client) => {
    worldSocket.emit('connection', client);
  });
});

worldSocket.on('connection', (socket) => {
  const player = {
    id: crypto.randomUUID(),
    name: 'Wanderer',
    x: 480,
    y: 270,
    color: `hsl(${Math.floor(Math.random() * 360)} 80% 65%)`,
    room: null,
    socket,
    lastMoveAt: 0,
  };

  socket.on('message', (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      socket.send(JSON.stringify({ type: 'error', message: 'Invalid message.' }));
      return;
    }

    if (message.type === 'join') {
      player.name = cleanText(message.name, 'Wanderer', 24);
      const error = joinWorld(player, message.room);
      if (error) socket.send(JSON.stringify({ type: 'error', message: error.error }));
      return;
    }

    if (message.type !== 'move' || !player.room) return;
    const now = Date.now();
    if (now - player.lastMoveAt < 45) return;
    const dx = Number(message.dx);
    const dy = Number(message.dy);
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || Math.abs(dx) > 1 || Math.abs(dy) > 1) return;
    player.lastMoveAt = now;
    player.x = Math.max(24, Math.min(WORLD_WIDTH - 24, player.x + dx * 10));
    player.y = Math.max(24, Math.min(WORLD_HEIGHT - 24, player.y + dy * 10));
    const room = rooms.get(player.room);
    if (room) broadcast(room, { type: 'player-moved', player: publicPlayer(player) });
  });

  socket.on('close', () => leaveWorld(player));
  socket.on('error', () => leaveWorld(player));
});

server.listen(PORT, () => console.log('SnozCoin demo backend running on', PORT));
