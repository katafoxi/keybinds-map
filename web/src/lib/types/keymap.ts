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

export const UI_LOCALES = ['ru', 'en'] as const;
export type UiLocale = (typeof UI_LOCALES)[number];
export const DEFAULT_UI_LOCALE: UiLocale = 'ru';

export const VIM_MODES = ['normal', 'insert', 'visual', 'cmdline'] as const;
export type VimMode = (typeof VIM_MODES)[number];

export const VIM_SECTORS = [
  'motion',
  'delete',
  'edit',
  'file',
  'marks',
  'search',
  'windows',
] as const;
export type VimSector = (typeof VIM_SECTORS)[number];

export const VIM_ROLES = [
  'command',
  'operator',
  'motion',
  'prefix',
  'textobject',
] as const;
export type VimRole = (typeof VIM_ROLES)[number];

export type CommandRef = {
  id: string;
  shortName: string;
  icon?: string;
  descriptions?: Partial<Record<UiLocale, string>>;
  sector?: VimSector;
  roles?: VimRole[];
  modes?: VimMode[];
};

/** Active HTML5 drag: source chip + optional hover target for in-slot preview. */
export type DragState = {
  command: CommandRef;
  sourceKey?: string;
  sourceSlot?: string;
  targetKey?: string;
  targetSlot?: ModifierSlot;
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
  descriptions?: Partial<Record<UiLocale, string>>;
  sector?: VimSector;
  roles?: VimRole[];
  modes?: VimMode[];
};

/** One keystroke in a Vim mode, optionally under a prefix layer. */
export type VimBinding = {
  commandId: string;
  mode: VimMode;
  keyName: string;
  slot: ModifierSlot;
  /** Prefix layer id; undefined/null = root of the mode. */
  layer?: string | null;
};

export type VimLayerDef = {
  id: string;
  triggerCommandId: string;
  mode: VimMode;
  keyName: string;
  slot: ModifierSlot;
};

export type VimOperatorDef = {
  commandId: string;
  doubledCommandId?: string;
  accepts: Array<'motion' | 'textobject'>;
};

export type VimRecipeStep = {
  mode: VimMode;
  keyName: string;
  slot: ModifierSlot;
  layer?: string | null;
};

export type VimRecipe = {
  id: string;
  title: string;
  sector?: VimSector;
  descriptions?: Partial<Record<UiLocale, string>>;
  steps: VimRecipeStep[];
};

export type VimExCommand = {
  id: string;
  shortName: string;
  descriptions?: Partial<Record<UiLocale, string>>;
  sector?: VimSector;
};

export type VimViewState =
  | { kind: 'idle' }
  | { kind: 'prefix'; layerId: string }
  | { kind: 'operator'; commandId: string }
  | { kind: 'textobject'; operatorId: string; kindInner: 'inner' | 'around' };

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
