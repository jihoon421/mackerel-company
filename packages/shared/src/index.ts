import { z } from 'zod';

export const Vec2Schema = z.object({ x: z.number().finite(), y: z.number().finite() });
export type Vec2 = z.infer<typeof Vec2Schema>;

export const GameModeSchema = z.enum(['solo', 'coop', 'daily-solo', 'daily-coop']);
export type GameMode = z.infer<typeof GameModeSchema>;
export const GamePhaseSchema = z.enum(['briefing', 'field', 'extraction', 'appraisal', 'payroll', 'shop', 'failed']);
export type GamePhase = z.infer<typeof GamePhaseSchema>;
export const ItemSizeSchema = z.enum(['one-hand', 'two-hand', 'coop']);
export type ItemSize = z.infer<typeof ItemSizeSchema>;
export const ItemKindSchema = z.enum(['equipment', 'consumable', 'artifact', 'key']);
export type ItemKind = z.infer<typeof ItemKindSchema>;
export const ArtifactRaritySchema = z.enum(['common', 'fine', 'rare', 'special', 'classified', 'cursed']);
export type ArtifactRarity = z.infer<typeof ArtifactRaritySchema>;

export const ItemInstanceSchema = z.object({
  instanceId: z.string().min(1),
  contentId: z.string().min(1),
  kind: ItemKindSchema,
  size: ItemSizeSchema,
  durability: z.number().min(0).max(100),
  estimatedMin: z.number().nonnegative().default(0),
  estimatedMax: z.number().nonnegative().default(0),
  trueValue: z.number().nonnegative().default(0),
  carriedBy: z.array(z.string()).max(2).default([]),
  position: Vec2Schema.optional()
});
export type ItemInstance = z.infer<typeof ItemInstanceSchema>;

export const HandSlotsSchema = z.object({ left: ItemInstanceSchema.nullable(), right: ItemInstanceSchema.nullable(), inventory: ItemInstanceSchema.nullable() });
export type HandSlots = z.infer<typeof HandSlotsSchema>;

export const PlayerInputSchema = z.object({
  seq: z.number().int().nonnegative(),
  move: Vec2Schema.refine(v => Math.hypot(v.x, v.y) <= 1.05, 'move vector too large'),
  aim: Vec2Schema.optional(),
  leftUse: z.boolean().default(false),
  rightUse: z.boolean().default(false),
  interact: z.boolean().default(false),
  dash: z.boolean().default(false),
  swapInventory: z.boolean().default(false),
  drop: z.boolean().default(false),
  ping: z.boolean().default(false),
  cartCommand: z.enum(['none', 'follow', 'stay', 'call', 'sonar', 'lure']).default('none')
});
export type PlayerInput = z.infer<typeof PlayerInputSchema>;

export const PlayerStateSchema = z.object({
  id: z.string(), nickname: z.string(), position: Vec2Schema, velocity: Vec2Schema,
  facing: z.number(), freshness: z.number().min(0).max(100), injuries: z.number().int().min(0).max(3),
  downed: z.boolean(), downedTimer: z.number().nonnegative(), reviveShield: z.number().nonnegative(),
  slots: HandSlotsSchema, connected: z.boolean(), ready: z.boolean(), lastInputSeq: z.number().int(),
  dashCooldown: z.number().nonnegative(), valueCarried: z.number().nonnegative(), color: z.string()
});
export type PlayerState = z.infer<typeof PlayerStateSchema>;

export const MonsterStateSchema = z.object({
  id: z.string(), contentId: z.string(), position: Vec2Schema, velocity: Vec2Schema,
  state: z.enum(['idle', 'patrol', 'investigate', 'chase', 'attack', 'stunned', 'retreat', 'disguised']),
  targetId: z.string().nullable(), health: z.number(), cooldown: z.number(), alert: z.number(), elite: z.boolean()
});
export type MonsterState = z.infer<typeof MonsterStateSchema>;

export const CartStateSchema = z.object({
  position: Vec2Schema, velocity: Vec2Schema, battery: z.number().min(0).max(100), health: z.number().min(0).max(100),
  mode: z.enum(['follow', 'stay', 'call', 'disabled']), carriedItemId: z.string().nullable(), recoveryAvailable: z.boolean(), hoseTension: z.number().min(0).max(1)
});
export type CartState = z.infer<typeof CartStateSchema>;

export const NoiseEventSchema = z.object({ id: z.string(), position: Vec2Schema, radius: z.number().positive(), intensity: z.number().min(0).max(1), ttl: z.number().positive(), source: z.string() });
export type NoiseEvent = z.infer<typeof NoiseEventSchema>;

export const ContractSchema = z.object({ id: z.string(), titleKey: z.string(), descriptionKey: z.string(), rewardMultiplier: z.number().positive(), quotaMultiplier: z.number().positive(), rule: z.string() });
export type Contract = z.infer<typeof ContractSchema>;

export const GameSnapshotSchema = z.object({
  tick: z.number().int(), seed: z.number().int(), mode: GameModeSchema, phase: GamePhaseSchema,
  day: z.number().int().positive(), mapId: z.string(), timeLeft: z.number().nonnegative(), quota: z.number().nonnegative(), recoveredValue: z.number().nonnegative(),
  danger: z.number().int().min(0).max(4), dangerProgress: z.number().min(0).max(1), extractionOpen: z.boolean(), extractionCountdown: z.number().nonnegative(),
  players: z.record(z.string(), PlayerStateSchema), monsters: z.record(z.string(), MonsterStateSchema), cart: CartStateSchema.nullable(), items: z.record(z.string(), ItemInstanceSchema),
  noises: z.array(NoiseEventSchema), activeContract: ContractSchema.nullable(), mapWidth: z.number(), mapHeight: z.number(), events: z.array(z.string()), completed: z.boolean(), success: z.boolean()
});
export type GameSnapshot = z.infer<typeof GameSnapshotSchema>;

export const CampaignSchema = z.object({
  version: z.literal(1), id: z.string(), mode: GameModeSchema, day: z.number().int().positive(), salary: z.number().nonnegative(), unlocks: z.array(z.string()),
  equipment: z.array(z.string()), streak: z.number().int().nonnegative(), warnings: z.number().int().min(0).max(3), lastSeed: z.number().int(), tutorialComplete: z.boolean(),
  codex: z.array(z.string()), dailyRecords: z.record(z.string(), z.object({ value: z.number(), survivalSeconds: z.number() })), updatedAt: z.string()
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const SettingsSchema = z.object({
  music: z.number().min(0).max(1), sfx: z.number().min(0).max(1), ui: z.number().min(0).max(1), muted: z.boolean(), haptics: z.boolean(), shake: z.number().min(0).max(1),
  colorMode: z.enum(['default', 'deuteranopia', 'protanopia', 'tritanopia']), highContrast: z.boolean(), captions: z.boolean(), joystickSize: z.number().min(0.8).max(1.5),
  buttonSize: z.number().min(0.8).max(1.5), buttonOpacity: z.number().min(0.35).max(1), leftHanded: z.boolean(), quality: z.enum(['auto', 'high', 'medium', 'low']),
  fpsLimit: z.union([z.literal(30), z.literal(60)]), language: z.enum(['ko', 'en'])
});
export type Settings = z.infer<typeof SettingsSchema>;

export const RoomCreateSchema = z.object({ nickname: z.string().trim().min(1).max(16).transform(s => s.replace(/[<>]/g, '')), campaignId: z.string().optional(), recoveryCode: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{10}$/).optional(), daily: z.boolean().optional() });
export const RoomJoinSchema = z.object({ code: z.string().regex(/^\d{6}$/), nickname: z.string().trim().min(1).max(16).transform(s => s.replace(/[<>]/g, '')), reconnectToken: z.string().optional() });

export const DEFAULT_SETTINGS: Settings = {
  music: 0.55, sfx: 0.8, ui: 0.8, muted: false, haptics: true, shake: 0.6,
  colorMode: 'default', highContrast: false, captions: true, joystickSize: 1, buttonSize: 1, buttonOpacity: 0.82, leftHanded: false, quality: 'auto', fpsLimit: 60, language: 'ko'
};

export const GAME_TICK_RATE = 20;
export const RECONNECT_GRACE_SECONDS = 20;
