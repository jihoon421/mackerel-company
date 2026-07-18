import { create } from 'zustand';
import type { Campaign, GameMode, GameSnapshot, Settings } from '@mackerel/shared';
import { DEFAULT_SETTINGS } from '@mackerel/shared';
import type { PayrollBreakdown } from '@mackerel/simulation';

export type Screen = 'loading'|'menu'|'mode'|'solo-slots'|'coop'|'lobby'|'briefing'|'game'|'results'|'shop'|'settings'|'codex'|'credits'|'offline';

interface GameStore {
  screen: Screen;
  mode: GameMode;
  campaign: Campaign | null;
  snapshot: GameSnapshot | null;
  payroll: PayrollBreakdown | null;
  settings: Settings;
  roomCode: string;
  roomId: string;
  reconnectToken: string;
  recoveryCode: string;
  localPlayerId: string;
  lobbyPlayers: Array<{id:string;nickname:string;ready:boolean;connected:boolean}>;
  connection: 'offline'|'connecting'|'good'|'poor'|'reconnecting';
  message: string;
  tutorialStep: number;
  setScreen(screen: Screen): void;
  setMode(mode: GameMode): void;
  setCampaign(campaign: Campaign | null): void;
  setSnapshot(snapshot: GameSnapshot | null): void;
  setPayroll(payroll: PayrollBreakdown | null): void;
  setSettings(settings: Settings): void;
  setRoom(data: Partial<Pick<GameStore,'roomCode'|'roomId'|'reconnectToken'|'recoveryCode'|'localPlayerId'>>): void;
  setLobbyPlayers(players: GameStore['lobbyPlayers']): void;
  setConnection(connection: GameStore['connection']): void;
  setMessage(message: string): void;
  setTutorialStep(step: number): void;
}

export const useGameStore = create<GameStore>(set => ({
  screen:'loading', mode:'solo', campaign:null, snapshot:null, payroll:null, settings:DEFAULT_SETTINGS,
  roomCode:'',roomId:'',reconnectToken:'',recoveryCode:'',localPlayerId:'solo-player',lobbyPlayers:[],connection:navigator.onLine?'good':'offline',message:'',tutorialStep:0,
  setScreen:screen=>set({screen}), setMode:mode=>set({mode}), setCampaign:campaign=>set({campaign}), setSnapshot:snapshot=>set({snapshot}), setPayroll:payroll=>set({payroll}),
  setSettings:settings=>set({settings}), setRoom:data=>set(data), setLobbyPlayers:lobbyPlayers=>set({lobbyPlayers}), setConnection:connection=>set({connection}), setMessage:message=>set({message}), setTutorialStep:tutorialStep=>set({tutorialStep})
}));
