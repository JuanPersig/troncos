const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Serve built Vite frontend in production
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback: serve index.html for any non-API, non-socket route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Room State Storage
// rooms: { [roomCode]: { players: [ { id, name, slot, ready, lives, score } ], gameRunning: boolean, seed: number } }
const rooms = {};

function generateSeed() {
  return Math.floor(Math.random() * 1000000);
}

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

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
        hostId: socket.id
      };
    }

    const room = rooms[roomKey];

    if (room.players.length >= 3) {
      socket.emit('error-message', 'Room is full (max 3 players)');
      return;
    }

    // Determine next available slot (0, 1, or 2)
    const takenSlots = room.players.map(p => p.slot);
    let assignedSlot = 0;
    for (let i = 0; i < 3; i++) {
      if (!takenSlots.includes(i)) {
        assignedSlot = i;
        break;
      }
    }

    const playerObj = {
      id: socket.id,
      name: name || `Jugador ${assignedSlot + 1}`,
      slot: assignedSlot,
      ready: false,
      lives: 3,
      score: 0,
      isBot: false
    };

    room.players.push(playerObj);
    currentRoom = roomKey;
    playerSlot = assignedSlot;

    socket.join(roomKey);

    console.log(`[Room ${roomKey}] ${playerObj.name} joined slot ${assignedSlot}`);

    // Notify user of successful join
    socket.emit('room-joined', {
      roomCode: roomKey,
      playerSlot: assignedSlot,
      players: room.players,
      hostId: room.hostId
    });

    // Notify room of updated player list
    io.to(roomKey).emit('room-update', {
      players: room.players,
      hostId: room.hostId,
      gameRunning: room.gameRunning
    });
  });

  socket.on('fill-bots', ({ roomCode }) => {
    const roomKey = (roomCode || currentRoom);
    if (!roomKey || !rooms[roomKey]) return;
    const room = rooms[roomKey];

    const takenSlots = room.players.map(p => p.slot);
    for (let i = 0; i < 3; i++) {
      if (!takenSlots.includes(i)) {
        room.players.push({
          id: `bot-${i}`,
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
      gameRunning: room.gameRunning
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
        gameRunning: room.gameRunning
      });
    }
  });

  socket.on('start-game', ({ roomCode }) => {
    const roomKey = roomCode || currentRoom;
    if (!roomKey || !rooms[roomKey]) return;

    const room = rooms[roomKey];
    room.gameRunning = true;
    room.seed = generateSeed();
    room.players.forEach(p => {
      p.lives = 3;
      p.score = 0;
    });

    console.log(`[Room ${roomKey}] Game Starting with seed ${room.seed}`);
    io.to(roomKey).emit('game-started', {
      seed: room.seed,
      players: room.players
    });
  });

  socket.on('player-jump', ({ roomCode, slot }) => {
    const roomKey = roomCode || currentRoom;
    if (!roomKey) return;
    socket.to(roomKey).emit('remote-jump', { slot: slot !== undefined ? slot : playerSlot });
  });

  socket.on('spawn-obstacle', ({ roomCode, obstacleData }) => {
    const roomKey = roomCode || currentRoom;
    if (!roomKey) return;
    socket.to(roomKey).emit('obstacle-spawned', obstacleData);
  });

  socket.on('player-hit', ({ roomCode, slot, remainingLives }) => {
    const roomKey = roomCode || currentRoom;
    if (!roomKey || !rooms[roomKey]) return;

    const room = rooms[roomKey];
    const player = room.players.find(p => p.slot === slot);
    if (player) {
      player.lives = remainingLives;
      io.to(roomKey).emit('player-hit-update', { slot, remainingLives, players: room.players });

      // Check if all players dead
      const alivePlayers = room.players.filter(p => p.lives > 0);
      if (alivePlayers.length === 0) {
        room.gameRunning = false;
        io.to(roomKey).emit('game-over-all', { players: room.players });
      }
    }
  });

  socket.on('restart-game', ({ roomCode }) => {
    const roomKey = roomCode || currentRoom;
    if (!roomKey || !rooms[roomKey]) return;

    const room = rooms[roomKey];
    room.gameRunning = true;
    room.seed = generateSeed();
    room.players.forEach(p => {
      p.lives = 3;
      p.score = 0;
    });

    io.to(roomKey).emit('game-started', {
      seed: room.seed,
      players: room.players
    });
  });

  // WebRTC Signaling Relay
  socket.on('webrtc-offer', ({ targetId, offer, fromSlot }) => {
    io.to(targetId).emit('webrtc-offer', { fromId: socket.id, fromSlot, offer });
  });

  socket.on('webrtc-answer', ({ targetId, answer, fromSlot }) => {
    io.to(targetId).emit('webrtc-answer', { fromId: socket.id, fromSlot, answer });
  });

  socket.on('webrtc-ice-candidate', ({ targetId, candidate, fromSlot }) => {
    io.to(targetId).emit('webrtc-ice-candidate', { fromId: socket.id, fromSlot, candidate });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
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
          gameRunning: room.gameRunning
        });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`[Server] Troncos Multiplayer Server running on http://localhost:${PORT}`);
});
