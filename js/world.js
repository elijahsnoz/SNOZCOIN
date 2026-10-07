const canvas = document.getElementById('world');
const context = canvas.getContext('2d');
const connection = document.getElementById('connection');
const message = document.getElementById('message');
const roomLabel = document.getElementById('room-label');
const players = new Map();
let socket;
let selfId;

function setMessage(text) {
  message.textContent = text;
}

function drawWorld() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#0b1521';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const glow = context.createRadialGradient(480, 270, 40, 480, 270, 500);
  glow.addColorStop(0, 'rgba(242,43,131,.16)');
  glow.addColorStop(1, 'rgba(8,8,8,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(245,238,0,.10)';
  context.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 48) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, canvas.height); context.stroke(); }
  for (let y = 0; y <= canvas.height; y += 48) { context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke(); }
  context.fillStyle = '#17151d';
  context.fillRect(330, 155, 300, 230);
  context.strokeStyle = 'rgba(245,238,0,.4)';
  context.strokeRect(330, 155, 300, 230);
  context.fillStyle = '#f5ee00';
  context.font = '900 18px system-ui';
  context.textAlign = 'center';
  context.fillText('SNOZ CREATIVE PLAZA', 480, 268);
  context.font = '13px system-ui';
  context.fillStyle = '#f22b83';
  context.fillText('PORTAL 02 / THE WORLD', 480, 296);

  for (const player of players.values()) {
    context.beginPath();
    context.fillStyle = player.color;
    context.arc(player.x, player.y, player.id === selfId ? 14 : 11, 0, Math.PI * 2);
    context.fill();
    if (player.id === selfId) {
      context.strokeStyle = '#fff';
      context.stroke();
    }
    context.fillStyle = '#fff';
    context.font = '12px system-ui';
    context.fillText(player.name, player.x, player.y - 20);
  }
}

function connect() {
  if (socket && socket.readyState === WebSocket.OPEN) socket.close();
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  socket = new WebSocket(`${protocol}://${location.host}/world`);
  socket.addEventListener('open', () => {
    connection.textContent = 'Online';
    connection.className = 'connection online';
    socket.send(JSON.stringify({
      type: 'join',
      name: document.getElementById('name').value,
      room: document.getElementById('room').value
    }));
  });
  socket.addEventListener('message', ({ data }) => {
    const event = JSON.parse(data);
    if (event.type === 'error') { setMessage(event.message); return; }
    if (event.type === 'world-state') {
      selfId = event.self.id;
      roomLabel.textContent = `Room: ${event.room} • ${event.players.length} explorer${event.players.length === 1 ? '' : 's'}`;
      event.players.forEach((player) => players.set(player.id, player));
      setMessage('You are in the plaza. Find another explorer and say hello.');
    } else if (event.type === 'player-joined' || event.type === 'player-moved') {
      players.set(event.player.id, event.player);
    } else if (event.type === 'player-left') {
      players.delete(event.id);
    }
    drawWorld();
  });
  socket.addEventListener('close', () => {
    connection.textContent = 'Offline';
    connection.className = 'connection offline';
    setMessage('Disconnected. Start the server and join again.');
  });
}

function move(dx, dy) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type: 'move', dx, dy }));
}

document.getElementById('join').addEventListener('click', () => {
  players.clear();
  connect();
});
document.addEventListener('keydown', (event) => {
  const directions = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
  const direction = directions[event.key];
  if (direction) { event.preventDefault(); move(...direction); }
});
drawWorld();
