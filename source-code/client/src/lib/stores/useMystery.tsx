import { create } from "zustand";

export type Character = 'detective' | 'historian' | 'archivist';
export type GamePhase = 'lobby' | 'character_select' | 'playing' | 'solved';

export interface Clue {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'artifact' | 'witness' | 'location';
  difficulty: number;
  requiredCharacter?: Character;
  historicalContext?: string;
}

export interface Mystery {
  id: string;
  title: string;
  period: 'ancient_rome' | 'medieval_europe' | 'victorian_era';
  description: string;
  solution: string;
  clues: Clue[];
}

export interface Player {
  id: string;
  username: string;
  character: Character;
  roomId: string;
}

export interface Theory {
  playerId: string;
  text: string;
  timestamp: number;
}

interface MysteryState {
  phase: GamePhase;
  roomId: string;
  currentPlayer: Player | null;
  players: Player[];
  currentMystery: Mystery | null;
  discoveredClues: string[];
  theories: Theory[];
  ws: WebSocket | null;

  setPhase: (phase: GamePhase) => void;
  setRoomId: (roomId: string) => void;
  setCurrentPlayer: (player: Player) => void;
  setPlayers: (players: Player[]) => void;
  setCurrentMystery: (mystery: Mystery) => void;
  discoverClue: (clueId: string) => void;
  addTheory: (theory: Theory) => void;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  joinRoom: (roomId: string, player: Player, mysteryId: string) => void;
  solveMystery: () => void;
}

export const useMystery = create<MysteryState>((set, get) => ({
  phase: 'lobby',
  roomId: '',
  currentPlayer: null,
  players: [],
  currentMystery: null,
  discoveredClues: [],
  theories: [],
  ws: null,

  setPhase: (phase) => set({ phase }),
  setRoomId: (roomId) => set({ roomId }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  setPlayers: (players) => set({ players }),
  setCurrentMystery: (mystery) => set({ currentMystery: mystery }),
  
  discoverClue: (clueId) => {
    const state = get();
    if (!state.discoveredClues.includes(clueId)) {
      set({ discoveredClues: [...state.discoveredClues, clueId] });
      
      if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        state.ws.send(JSON.stringify({
          type: 'discover_clue',
          payload: {
            roomId: state.roomId,
            clueId,
            playerId: state.currentPlayer?.id,
          },
        }));
      }
    }
  },

  addTheory: (theory) => {
    const state = get();
    set({ theories: [...state.theories, theory] });

    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({
        type: 'add_theory',
        payload: {
          roomId: state.roomId,
          playerId: theory.playerId,
          text: theory.text,
        },
      }));
    }
  },

  connectWebSocket: () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const state = get();

      switch (message.type) {
        case 'player_joined':
          if (message.payload.room) {
            set({ players: message.payload.room.players });
          }
          break;
        case 'player_left':
          set({
            players: state.players.filter(p => p.id !== message.payload.playerId),
          });
          break;
        case 'clue_discovered':
          set({ discoveredClues: message.payload.discoveredClues });
          break;
        case 'theory_added':
          set({ theories: message.payload.theories });
          break;
        case 'mystery_solved':
          set({ phase: 'solved' });
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    set({ ws });
  },

  disconnectWebSocket: () => {
    const state = get();
    if (state.ws) {
      state.ws.close();
      set({ ws: null });
    }
  },

  joinRoom: (roomId, player, mysteryId) => {
    const state = get();
    set({ roomId, currentPlayer: player });

    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({
        type: 'join_room',
        payload: {
          roomId,
          player,
          mysteryId,
        },
      }));
    }
  },

  solveMystery: () => {
    const state = get();
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify({
        type: 'solve_mystery',
        payload: {
          roomId: state.roomId,
        },
      }));
    }
    set({ phase: 'solved' });
  },
}));
