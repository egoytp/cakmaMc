import { RemotePlayerData } from './playerMesh';
import { BlockType } from './textures';

export interface ChatMessage {
  id: string;
  sender: string;
  color?: string;
  text: string;
  timestamp: number;
}

export interface NetworkCallbacks {
  onInit: (data: {
    playerId: string;
    roomId: string;
    seed: number;
    timeOfDay: number;
    players: RemotePlayerData[];
    blockChanges: Array<{ x: number; y: number; z: number; type: number }>;
  }) => void;
  onPlayerJoined: (player: RemotePlayerData) => void;
  onPlayerMoved: (data: {
    id: string;
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
    isMoving: boolean;
    isSprinting: boolean;
    heldItem: number;
  }) => void;
  onPlayerLeft: (id: string) => void;
  onPlayersSync?: (players: RemotePlayerData[]) => void;
  onBlockChanged: (change: { x: number; y: number; z: number; type: BlockType }) => void;
  onChat: (msg: ChatMessage) => void;
  onTimeSync: (timeOfDay: number) => void;
  onPingUpdate: (pingMs: number) => void;
  onError: (msg: string) => void;
}

export class NetworkManager {
  private ws: WebSocket | null = null;
  private callbacks: NetworkCallbacks;
  private pingStartTime = 0;
  private pingInterval: number | null = null;
  private lastSendTime = 0;
  private isIntentionalDisconnect = false;
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;

  // Stored state for reconnection
  private currentRoomId = '';
  private currentName = '';
  private currentColor = '';
  private currentX = 0;
  private currentY = 30;
  private currentZ = 0;

  isConnected = false;
  myPlayerId: string | null = null;

  constructor(callbacks: NetworkCallbacks) {
    this.callbacks = callbacks;
  }

  connect(roomId: string, playerName: string, playerColor: string, x = 0, y = 30, z = 0) {
    this.isIntentionalDisconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    this.currentRoomId = roomId;
    this.currentName = playerName;
    this.currentColor = playerColor;
    this.currentX = x;
    this.currentY = y;
    this.currentZ = z;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Always connect to the exact same origin the user is currently on!
    // This ensures same-origin cookie transmission and direct communication with the same server instance.
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        const normalizedRoomId = roomId.trim().toLowerCase();
        this.ws?.send(
          JSON.stringify({
            type: 'join',
            roomId: normalizedRoomId,
            name: playerName,
            color: playerColor,
            x: this.currentX,
            y: this.currentY,
            z: this.currentZ,
          })
        );

        // Start ping loop
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = window.setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.pingStartTime = performance.now();
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 2500);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'init') {
            this.myPlayerId = data.playerId;
            // Filter self from initial player list
            if (data.players && Array.isArray(data.players)) {
              data.players = data.players.filter((p: RemotePlayerData) => p.id !== this.myPlayerId);
            }
            this.callbacks.onInit(data);
          } else if (data.type === 'player_joined') {
            if (data.player && data.player.id !== this.myPlayerId) {
              this.callbacks.onPlayerJoined(data.player);
            }
          } else if (data.type === 'player_moved') {
            if (data.id && data.id !== this.myPlayerId) {
              this.callbacks.onPlayerMoved(data);
            }
          } else if (data.type === 'players_sync' && this.callbacks.onPlayersSync) {
            const remoteOnly = (data.players as RemotePlayerData[]).filter((p) => p.id !== this.myPlayerId);
            this.callbacks.onPlayersSync(remoteOnly);
          } else if (data.type === 'player_left') {
            if (data.id && data.id !== this.myPlayerId) {
              this.callbacks.onPlayerLeft(data.id);
            }
          } else if (data.type === 'block_changed') {
            this.callbacks.onBlockChanged(data.change);
          } else if (data.type === 'chat') {
            this.callbacks.onChat({
              id: 'chat_' + Math.random().toString(36).substring(2, 8),
              sender: data.sender,
              color: data.color,
              text: data.text,
              timestamp: data.timestamp || Date.now(),
            });
          } else if (data.type === 'time_sync') {
            this.callbacks.onTimeSync(data.timeOfDay);
          } else if (data.type === 'pong') {
            const ping = Math.round(performance.now() - this.pingStartTime);
            this.callbacks.onPingUpdate(ping);
          } else if (data.type === 'error') {
            this.callbacks.onError(data.message || 'Server error');
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket connection status:', err);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.pingInterval) clearInterval(this.pingInterval);

        // Auto-reconnect if not explicitly disconnected by user
        if (!this.isIntentionalDisconnect && this.reconnectAttempts < 10) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(1.4, this.reconnectAttempts), 6000);
          this.reconnectTimeout = window.setTimeout(() => {
            if (!this.isIntentionalDisconnect) {
              this.connect(
                this.currentRoomId,
                this.currentName,
                this.currentColor,
                this.currentX,
                this.currentY,
                this.currentZ
              );
            }
          }, delay);
        }
      };
    } catch (err) {
      console.error('Failed to instantiate WebSocket:', err);
      this.callbacks.onError('Could not establish WebSocket');
    }
  }

  sendMove(
    x: number,
    y: number,
    z: number,
    yaw: number,
    pitch: number,
    isMoving: boolean,
    isSprinting: boolean,
    heldItem: number
  ) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.currentX = x;
    this.currentY = y;
    this.currentZ = z;

    // Throttle move packets to max 25 times per second
    const now = performance.now();
    if (now - this.lastSendTime < 40) return;
    this.lastSendTime = now;

    this.ws.send(
      JSON.stringify({
        type: 'move',
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        z: Math.round(z * 100) / 100,
        yaw: Math.round(yaw * 1000) / 1000,
        pitch: Math.round(pitch * 1000) / 1000,
        isMoving,
        isSprinting,
        heldItem,
      })
    );
  }

  sendBlockChange(x: number, y: number, z: number, blockType: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'block_change',
        x,
        y,
        z,
        blockType,
      })
    );
  }

  sendChat(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'chat',
        text,
      })
    );
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.isConnected = false;
  }
}
