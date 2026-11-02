import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Types
interface PlayerState {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  isMoving: boolean;
  isSprinting: boolean;
  heldItem: number;
  ping: number;
  lastSeen: number;
}

interface BlockChange {
  x: number;
  y: number;
  z: number;
  type: number; // 0 = air
  placedBy: string;
}

interface Room {
  id: string;
  name: string;
  isPrivate: boolean;
  seed: number;
  maxPlayers: number;
  createdAt: number;
  timeOfDay: number; // 0 to 24000
  blockChanges: Map<string, BlockChange>; // key "x,y,z"
  players: Map<string, { ws: WebSocket; state: PlayerState }>;
}

// Global rooms store
const rooms = new Map<string, Room>();

// Create initial default public servers
function createDefaultRoom(id: string, name: string, seed: number) {
  rooms.set(id, {
    id,
    name,
    isPrivate: false,
    seed,
    maxPlayers: 16,
    createdAt: Date.now(),
    timeOfDay: 6000, // daytime
    blockChanges: new Map(),
    players: new Map(),
  });
}

createDefaultRoom('public-survival', 'Earth Alpha [Survival]', 12345);
createDefaultRoom('public-creative', 'Sky Highlands [Creative]', 88888);
createDefaultRoom('public-desert', 'Dune Oasis [Multiplayer]', 45678);

// Helper to broadcast to a room
function broadcastToRoom(roomId: string, message: object, excludePlayerId?: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const data = JSON.stringify(message);
  for (const [playerId, client] of room.players) {
    if (excludePlayerId && playerId === excludePlayerId) continue;
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(data);
      } catch (err) {
        console.error('Failed to send to client', playerId, err);
      }
    }
  }
}

// API Routes
app.use(express.json());

// List all public rooms
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values())
    .filter((r) => !r.isPrivate)
    .map((r) => ({
      id: r.id,
      name: r.name,
      seed: r.seed,
      playerCount: r.players.size,
      maxPlayers: r.maxPlayers,
      createdAt: r.createdAt,
    }));
  res.json({ rooms: roomList });
});

// Create custom room
app.post('/api/rooms', (req, res) => {
  const { name, isPrivate, seed, maxPlayers } = req.body;
  const roomId = 'ROOM-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  const roomSeed = Number(seed) || Math.floor(Math.random() * 100000);
  const roomName = (name && String(name).trim().slice(0, 30)) || `Room ${roomId}`;

  const room: Room = {
    id: roomId,
    name: roomName,
    isPrivate: Boolean(isPrivate),
    seed: roomSeed,
    maxPlayers: Math.min(Math.max(Number(maxPlayers) || 8, 2), 32),
    createdAt: Date.now(),
    timeOfDay: 6000,
    blockChanges: new Map(),
    players: new Map(),
  };

  const normalizedId = roomId.toLowerCase();
  rooms.set(normalizedId, room);
  res.json({
    id: roomId,
    name: room.name,
    seed: room.seed,
    isPrivate: room.isPrivate,
    maxPlayers: room.maxPlayers,
  });
});

// Check room exists
app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.get(req.params.id.toLowerCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    id: room.id,
    name: room.name,
    seed: room.seed,
    playerCount: room.players.size,
    maxPlayers: room.maxPlayers,
    isPrivate: room.isPrivate,
  });
});

// WebSocket Connection Management
wss.on('connection', (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let playerId: string | null = null;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const { type } = msg;

      if (type === 'join') {
        const rawRoomId = String(msg.roomId || 'public-survival').trim();
        const roomId = rawRoomId.toLowerCase();
        const { name, color, x, y, z } = msg;
        let room = rooms.get(roomId);

        // If room doesn't exist, create it if it has standard custom prefix or public
        if (!room) {
          room = {
            id: roomId,
            name: rawRoomId.startsWith('ROOM-') || rawRoomId.startsWith('room-') ? `Room ${rawRoomId.toUpperCase()}` : rawRoomId,
            isPrivate: rawRoomId.startsWith('ROOM-') || rawRoomId.startsWith('room-'),
            seed: 42424,
            maxPlayers: 16,
            createdAt: Date.now(),
            timeOfDay: 6000,
            blockChanges: new Map(),
            players: new Map(),
          };
          rooms.set(roomId, room);
        }

        if (room.players.size >= room.maxPlayers) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
          return;
        }

        playerId = 'p_' + Math.random().toString(36).substring(2, 9);
        currentRoomId = roomId;

        const initialPlayer: PlayerState = {
          id: playerId,
          name: String(name || 'Steve').slice(0, 16),
          color: color || '#3b82f6',
          x: Number(x) || 0,
          y: Number(y) || 20,
          z: Number(z) || 0,
          yaw: 0,
          pitch: 0,
          isMoving: false,
          isSprinting: false,
          heldItem: 1,
          ping: 20,
          lastSeen: Date.now(),
        };

        room.players.set(playerId, { ws, state: initialPlayer });

        // Send welcome payload with room details, seed, other players, and existing block changes
        const existingPlayers = Array.from(room.players.values())
          .filter((p) => p.state.id !== playerId)
          .map((p) => p.state);

        const blockChangesArray = Array.from(room.blockChanges.values());

        ws.send(
          JSON.stringify({
            type: 'init',
            playerId,
            roomId,
            seed: room.seed,
            timeOfDay: room.timeOfDay,
            players: existingPlayers,
            blockChanges: blockChangesArray,
          })
        );

        // Notify other players
        broadcastToRoom(
          roomId,
          {
            type: 'player_joined',
            player: initialPlayer,
          },
          playerId
        );

        // Send system chat
        broadcastToRoom(roomId, {
          type: 'chat',
          sender: 'System',
          color: '#fbbf24',
          text: `${initialPlayer.name} has joined the world!`,
          timestamp: Date.now(),
        });
      }

      if (type === 'move' && currentRoomId && playerId) {
        const room = rooms.get(currentRoomId);
        if (!room) return;
        const playerEntry = room.players.get(playerId);
        if (!playerEntry) return;

        const { x, y, z, yaw, pitch, isMoving, isSprinting, heldItem } = msg;

        // Basic sanity check to prevent crazy teleports
        playerEntry.state.x = Number(x);
        playerEntry.state.y = Number(y);
        playerEntry.state.z = Number(z);
        playerEntry.state.yaw = Number(yaw) || 0;
        playerEntry.state.pitch = Number(pitch) || 0;
        playerEntry.state.isMoving = Boolean(isMoving);
        playerEntry.state.isSprinting = Boolean(isSprinting);
        if (typeof heldItem === 'number') {
          playerEntry.state.heldItem = heldItem;
        }
        playerEntry.state.lastSeen = Date.now();

        // Broadcast to other players in the room (with full name and color so new listeners have complete data)
        broadcastToRoom(
          currentRoomId,
          {
            type: 'player_moved',
            id: playerId,
            name: playerEntry.state.name,
            color: playerEntry.state.color,
            x: playerEntry.state.x,
            y: playerEntry.state.y,
            z: playerEntry.state.z,
            yaw: playerEntry.state.yaw,
            pitch: playerEntry.state.pitch,
            isMoving: playerEntry.state.isMoving,
            isSprinting: playerEntry.state.isSprinting,
            heldItem: playerEntry.state.heldItem,
          },
          playerId
        );
      }

      if (type === 'block_change' && currentRoomId && playerId) {
        const room = rooms.get(currentRoomId);
        if (!room) return;
        const playerEntry = room.players.get(playerId);
        const playerName = playerEntry?.state.name || 'Unknown';

        const { x, y, z, blockType } = msg;
        const bx = Math.round(Number(x));
        const by = Math.round(Number(y));
        const bz = Math.round(Number(z));
        const bType = Number(blockType);

        // Limit block modification area bounds
        if (by < 0 || by > 128 || Math.abs(bx) > 500 || Math.abs(bz) > 500) {
          return;
        }

        const key = `${bx},${by},${bz}`;
        const change: BlockChange = {
          x: bx,
          y: by,
          z: bz,
          type: bType,
          placedBy: playerName,
        };

        room.blockChanges.set(key, change);

        // Broadcast to all players (including sender to reconcile)
        broadcastToRoom(currentRoomId, {
          type: 'block_changed',
          change,
        });
      }

      if (type === 'chat' && currentRoomId && playerId) {
        const room = rooms.get(currentRoomId);
        if (!room) return;
        const playerEntry = room.players.get(playerId);
        if (!playerEntry) return;

        const text = String(msg.text || '').trim().slice(0, 150);
        if (!text) return;

        broadcastToRoom(currentRoomId, {
          type: 'chat',
          sender: playerEntry.state.name,
          color: playerEntry.state.color,
          text,
          timestamp: Date.now(),
        });
      }

      if (type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (e) {
      console.error('WebSocket message parsing error', e);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && playerId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        const player = room.players.get(playerId);
        const name = player?.state.name || 'A player';
        room.players.delete(playerId);

        broadcastToRoom(currentRoomId, {
          type: 'player_left',
          id: playerId,
        });

        broadcastToRoom(currentRoomId, {
          type: 'chat',
          sender: 'System',
          color: '#94a3b8',
          text: `${name} has left the world.`,
          timestamp: Date.now(),
        });

        // Clean up empty custom rooms after 5 minutes
        if (room.isPrivate && room.players.size === 0) {
          setTimeout(() => {
            if (room.players.size === 0) {
              rooms.delete(room.id);
            }
          }, 300000);
        }
      }
    }
  });
});

// Periodic server tick: advance time of day and sync
setInterval(() => {
  for (const [roomId, room] of rooms) {
    if (room.players.size > 0) {
      room.timeOfDay = (room.timeOfDay + 10) % 24000;
      // Periodic time sync every 5 seconds
      if (room.timeOfDay % 100 === 0) {
        broadcastToRoom(roomId, {
          type: 'time_sync',
          timeOfDay: room.timeOfDay,
        });
      }
      // Guaranteed presence and coordinates sync: broadcasts full active player roster
      const playerStates = Array.from(room.players.values()).map((p) => p.state);
      broadcastToRoom(roomId, {
        type: 'players_sync',
        players: playerStates,
      });
    }
  }
}, 500);

// Mounting Vite in development or static build in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
