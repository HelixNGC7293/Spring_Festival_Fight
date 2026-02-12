export enum RoleType {
  AUNT = '七姑八大姨',
  KID = '熊孩子',
  GRANDPA = '老爷爷',
  YOUTH = '打工年轻人',
}

export interface Character {
  id: string;
  role: RoleType;
  name: string;
  face: number; // HP
  maxFace: number;
  isPlayer: boolean;
  isAlive: boolean;
  description: string;
  avatar: string; // Emoji char
}

export interface GameCard {
  id: string;
  title: string;
  description: string;
  targetHint: string;
}

export interface LogEntry {
  id: string;
  speaker: string;
  text: string;
  type: 'narrative' | 'dialogue' | 'system' | 'damage';
}

export interface AIAction {
  role: RoleType;
  actionTitle: string;
  actionDescription: string;
  target?: string;
}

export interface RoundResult {
  narrative: string;
  aiActions: AIAction[];
  statUpdates: { role: RoleType; damage: number }[];
  summaryPrompt: string;
}

export enum GamePhase {
  SELECT_ROLE,
  INTRO,
  PLAYER_TURN,
  PROCESSING,
  ROUND_SUMMARY,
  BOSS_INTRO,
  BOSS_BATTLE,
  GAME_OVER,
}