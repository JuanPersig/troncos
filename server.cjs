const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3001;
const DEFAULT_GAME = 'jump-logs';

const app = express();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Jumping Friends', rooms: Object.keys(rooms).length });
});

// Serve built Vite frontend in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  path: '/socket.io/'
});

// SPA fallback
app.get('/{*splat}', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build not found.');
  }
});

// Room Storage
const rooms = {};

function generateSeed() {
  return Math.floor(Math.random() * 1000000);
}

io.on('connection', (socket) => {
  console.log(`[JumpingFriends] Connected: ${socket.id}`);

  let currentRoom = null;
  let playerSlot = null;

  socket.on('join-room', ({ roomCode, name }) => {
    const roomKey = (roomCode || 'LOBBY-1').toUpperCase().trim();

    if (!rooms[roomKey]) {
      rooms[roomKey] = {
        code: roomKey,
        players: [],
        gameRunning: false,
        seed: generateSeed(),
        hostId: socket.id,
        selectedGame: DEFAULT_GAME,
        maxPlayers: 3,
        gameStartTime: null
      };
    }

    const room = rooms[roomKey];

    if (room.players.length >= room.maxPlayers) {
      socket.emit('error-message', `La sala está llena (máximo ${room.maxPlayers} jugadores)`);
      return;
    }

    const takenSlots = room.players.map(p => p.slot);
    let assignedSlot = 0;
    for (let i = 0; i < room.maxPlayers; i++) {
      if (!takenSlots.includes(i)) {
        assignedSlot = i;
        break;
      }
    }

    const playerObj = {
      id: socket.id,
      name: name || `Jugador ${assignedSlot + 1}`,
      slot: assignedSlot,
      ready: true,
      lives: 3,
      score: 0,
      isBot: false
    };

    room.players.push(playerObj);
    currentRoom = roomKey;
    playerSlot = assignedSlot;

    socket.join(roomKey);

    console.log(`[JumpingFriends] [Room ${roomKey}] ${playerObj.name} joined slot ${assignedSlot}`);

    socket.emit('room-joined', {
      roomCode: roomKey,
      playerSlot: assignedSlot,
      players: room.players,
      hostId: room.hostId,
      selectedGame: room.selectedGame,
      maxPlayers: room.maxPlayers
    });

    io.to(roomKey).emit('room-update', {
      players: room.players,
      hostId: room.hostId,
      gameRunning: room.gameRunning,
      selectedGame: room.selectedGame
    });
  });

  socket.on('leave-room', ({ roomCode }) => {
    const roomKey = roomCode || currentRoom;
    if (!roomKey || !rooms[roomKey]) return;
    
    const room = rooms[roomKey];
    room.players = room.players.filter(p => p.id !== socket.id);
    
    socket.leave(roomKey);
    currentRoom = null;
    playerSlot = null;

    if (room.players.length === 0) {
      delete rooms[roomKey];
    } else {
      if (room.hostId === socket.id) {
        room.hostId = room.players[0].id;
      }
      io.to(roomKey).emit('room-update', {
        players: room.players,
        hostId: room.hostId,
        gameRunning: room.gameRunning,
        selectedGame: room.selectedGame
      });
    }
  });

  socket.on('fill-bots', ({ roomCode }) => {
    const roomKey = (roomCode || currentRoom);
    if (!roomKey || !rooms[roomKey]) return;
    const room = rooms[roomKey];

    const takenSlots = room.players.map(p => p.slot);
    for (let i = 0; i < room.maxPlayers; i++) {
      if (!takenSlots.includes(i)) {
        room.players.push({
          id: `bot-${i}-${Date.now()}`,
          name: `Bot ${i + 1}`,
          slot: i,
          ready: true,
          lives: 3,
          score: 0,
          isBot: true
        });
      }
    }

    io.to(roomKey).emit('room-update', {
      players: room.players,
      hostId: room.hostId,
      gameRunning: room.gameRunning,
      selectedGame: room.selectedGame
    });
  });

  socket.on('toggle-ready', ({ roomCode }) => {
    const roomKey = roomCode || currentRoom;
    if (!roomKey || !rooms[roomKey]) return;

    const room = rooms[roomKey];
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = !player.ready;
      io.to(roomKey).emit('room-update', {
        players: room.players,
        hostId: room.hostId,
        gameRunning: room.gameRunning,
        selectedGame: room.selectedGame
      });
    }
  });

  socket.on('select-game', ({ roomCode, gameId }) => {
    const roomKey = roomCode || currentRoom;
    if (!roomKey || !rooms[roomKey]) return;
    const room = rooms[roomKey];
    
    if (room.hostId === socket.id) {
      room.selectedGame = gameId;
      console.log(`[JumpingFriends] [Room ${roomKey}] Game selected: ${gameId}`);
      io.to(roomKey).emit('room-update', {
        players: room.players,
        hostId: room.hostId,
        gameRunning: room.gameRunning,
        selectedGame: room.selectedGame
      });
    }
  });

  socket.on('start-game', ({ roomCode }) => {
    const roomKey = roomCode || currentRoom;
    if (!roomKey || !rooms[roomKey]) return;

    const room = rooms[roomKey];
    room.gameRunning = true;
    room.gameStartTime = Date.now();
    room.seed = generateSeed();
    room.players.forEach(p => {
      p.lives = 3;
      p.score = 0;
    });

    console.log(`[JumpingFriends] [Room ${roomKey}] Game Starting: ${room.selectedGame} (seed: ${room.seed})`);
    io.to(roomKey).emit('game-started', {
      seed: room.seed,
      players: room.players,
      selectedGame: room.selectedGame
    });
  });

  socket.on('game-event', ({ roomCode, eventName, data }) => {
    const roomKey = roomCode || currentRoom;
    if (!roomKey) return;
    socket.to(roomKey).emit('game-event', { eventName, data });
  });

  socket.on('player-jump', ({ roomCode, slot }) => {
    const roomKey = roomCode || currentRoom;
    if (!roomKey) return;
    socket.to(roomKey).emit('remote-jump', { slot: slot !== undefined ? slot : playerSlot });
  });

  socket.on('player-hit', ({ roomCode, slot, remainingLives }) => {
    const roomKey = roomCode || currentRoom;
    if (!roomKey || !rooms[roomKey]) return;

    const room = rooms[roomKey];
    const player = room.players.find(p => p.slot === slot);
    if (player) {
      player.lives = remainingLives;
      io.to(roomKey).emit('player-hit-update', { slot, remainingLives, players: room.players });

      const alivePlayers = room.players.filter(p => p.lives > 0);
      if (alivePlayers.length === 0) {
        room.gameRunning = false;
        const duration = Date.now() - (room.gameStartTime || Date.now());
        
        io.to(roomKey).emit('game-over-all', { players: room.players });
        io.to(roomKey).emit('game-results', {
          gameId: room.selectedGame || DEFAULT_GAME,
          players: room.players,
          duration: duration
        });
      }
    }
  });

  socket.on('restart-game', ({ roomCode }) => {
    const roomKey = roomCode || currentRoom;
    if (!roomKey || !rooms[roomKey]) return;

    const room = rooms[roomKey];
    room.gameRunning = true;
    room.gameStartTime = Date.now();
    room.seed = generateSeed();
    room.players.forEach(p => {
      p.lives = 3;
      p.score = 0;
    });

    io.to(roomKey).emit('game-started', {
      seed: room.seed,
      players: room.players,
      selectedGame: room.selectedGame
    });
  });

  socket.on('webrtc-offer', (data = {}) => {
    const { targetId, offer, fromSlot } = data || {};
    if (targetId && offer) {
      io.to(targetId).emit('webrtc-offer', { fromId: socket.id, fromSlot, offer });
    }
  });

  socket.on('webrtc-answer', (data = {}) => {
    const { targetId, answer, fromSlot } = data || {};
    if (targetId && answer) {
      io.to(targetId).emit('webrtc-answer', { fromId: socket.id, fromSlot, answer });
    }
  });

  socket.on('webrtc-ice-candidate', (data = {}) => {
    const { targetId, candidate, fromSlot } = data || {};
    if (targetId && candidate) {
      io.to(targetId).emit('webrtc-ice-candidate', { fromId: socket.id, fromSlot, candidate });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[JumpingFriends] Disconnected: ${socket.id}`);
    if (currentRoom && rooms[currentRoom]) {
      const room = rooms[currentRoom];
      room.players = room.players.filter(p => p.id !== socket.id);

      if (room.players.length === 0) {
        delete rooms[currentRoom];
      } else {
        if (room.hostId === socket.id) {
          room.hostId = room.players[0].id;
        }
        io.to(currentRoom).emit('room-update', {
          players: room.players,
          hostId: room.hostId,
          gameRunning: room.gameRunning,
          selectedGame: room.selectedGame
        });
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[JumpingFriends] Server running on port ${PORT}`);
  console.log(`[JumpingFriends] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[JumpingFriends] Dist exists: ${fs.existsSync(distPath)}`);
});
