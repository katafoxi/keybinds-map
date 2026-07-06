export type ModifierSlot = 'push' | 'a' | 'c' | 's' | 'ac' | 'as' | 'cs' | 'acs';

export const MODIFIER_SLOTS: ModifierSlot[] = [
  'push',
  'a',
  'c',
  's',
  'ac',
  'as',
  'cs',
  'acs',
];

export type CommandRef = {
  id: string;
  shortName: string;
  icon?: string;
};

export type SlotBindings = Partial<Record<ModifierSlot, CommandRef>>;

export type KeyBindings = Record<string, SlotBindings>;

export type ParsedCommands = Record<string, Record<string, string>>;

export type KeymapMetadata = {
  version: string;
  name: string;
};

export type PrintLayerMode = 'all' | 'push' | 'visible';

export type DraftState = {
  selectedProgram: string;
  bindings: KeyBindings;
  unassigned: CommandRef[];
  metadata: KeymapMetadata;
  sourceXml: string;
  updatedAt: number;
};

export type ProgramInfo = {
  slug: string;
  title: string;
  icon: string;
  site: string;
  settingsFileInfo?: string;
  supported: boolean;
  /** IDE/text editor: disallow push and Shift on symbol keys; see bindingPolicy.ts */
  isBounded?: boolean;
};

export type CommandCatalogEntry = {
  id: string;
  shortName: string;
  iconPath?: string;
};

export type ProgramCatalog = {
  programs: ProgramInfo[];
  commands: Record<string, CommandCatalogEntry[]>;
};

export type SavedProfile = {
  id: string;
  name: string;
  program: string;
  xml: string;
  updatedAt: number;
};

export const PROFILE_SLOT_IDS = ['standard', 'custom1', 'custom2'] as const;
export type ProfileSlotId = (typeof PROFILE_SLOT_IDS)[number];

export const PROFILE_SLOT_LABELS: Record<ProfileSlotId, string> = {
  standard: 'Стандартная',
  custom1: 'Custom1',
  custom2: 'Custom2',
};

export type ProfileSlotData = {
  program: string;
  xml: string;
  updatedAt: number;
};

export type ProfileSlotsStore = Partial<Record<'custom1' | 'custom2', ProfileSlotData>>;

export type KeyboardKey = {
  backName: string;
  frontName: string;
  bindings: SlotBindings;
};
