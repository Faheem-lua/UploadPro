import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface Player {
  id: string;
  username: string;
  character: 'detective' | 'historian' | 'archivist';
  roomId: string;
}

export interface GameRoom {
  id: string;
  players: Map<string, Player>;
  mysteryId: string;
  discoveredClues: Set<string>;
  theories: Array<{ playerId: string; text: string; timestamp: number }>;
  solved: boolean;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private rooms: Map<string, GameRoom> = new Map();
  private playerSockets: Map<string, WebSocket> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection');

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: any) {
    const { type, payload } = message;

    switch (type) {
      case 'join_room':
        this.handleJoinRoom(ws, payload);
        break;
      case 'discover_clue':
        this.handleDiscoverClue(ws, payload);
        break;
      case 'add_theory':
        this.handleAddTheory(ws, payload);
        break;
      case 'solve_mystery':
        this.handleSolveMystery(ws, payload);
        break;
    }
  }

  private handleJoinRoom(ws: WebSocket, payload: any) {
    const { roomId, player } = payload;

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        players: new Map(),
        mysteryId: payload.mysteryId || 'ancient_rome_1',
        discoveredClues: new Set(),
        theories: [],
        solved: false,
      });
    }

    const room = this.rooms.get(roomId)!;
    room.players.set(player.id, player);
    this.playerSockets.set(player.id, ws);

    this.broadcast(roomId, {
      type: 'player_joined',
      payload: {
        player,
        room: this.getRoomData(roomId),
      },
    });
  }

  private handleDiscoverClue(ws: WebSocket, payload: any) {
    const { roomId, clueId, playerId } = payload;
    const room = this.rooms.get(roomId);

    if (room) {
      room.discoveredClues.add(clueId);
      this.broadcast(roomId, {
        type: 'clue_discovered',
        payload: { clueId, playerId, discoveredClues: Array.from(room.discoveredClues) },
      });
    }
  }

  private handleAddTheory(ws: WebSocket, payload: any) {
    const { roomId, playerId, text } = payload;
    const room = this.rooms.get(roomId);

    if (room) {
      const theory = { playerId, text, timestamp: Date.now() };
      room.theories.push(theory);
      this.broadcast(roomId, {
        type: 'theory_added',
        payload: { theory, theories: room.theories },
      });
    }
  }

  private handleSolveMystery(ws: WebSocket, payload: any) {
    const { roomId } = payload;
    const room = this.rooms.get(roomId);

    if (room) {
      room.solved = true;
      this.broadcast(roomId, {
        type: 'mystery_solved',
        payload: { roomId },
      });
    }
  }

  private handleDisconnect(ws: WebSocket) {
    for (const [playerId, socket] of this.playerSockets.entries()) {
      if (socket === ws) {
        for (const [roomId, room] of this.rooms.entries()) {
          if (room.players.has(playerId)) {
            room.players.delete(playerId);
            this.broadcast(roomId, {
              type: 'player_left',
              payload: { playerId },
            });
          }
        }
        this.playerSockets.delete(playerId);
        break;
      }
    }
  }

  private broadcast(roomId: string, message: any) {
    const room = this.rooms.get(roomId);
    if (room) {
      for (const playerId of room.players.keys()) {
        const socket = this.playerSockets.get(playerId);
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(message));
        }
      }
    }
  }

  private getRoomData(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      id: room.id,
      players: Array.from(room.players.values()),
      mysteryId: room.mysteryId,
      discoveredClues: Array.from(room.discoveredClues),
      theories: room.theories,
      solved: room.solved,
    };
  }
}

export const wsManager = new WebSocketManager();
