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

export type ProgramInfo = {
  slug: string;
  title: string;
  icon: string;
  site: string;
  settingsFileInfo?: string;
  supported: boolean;
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

export type KeyboardKey = {
  backName: string;
  frontName: string;
  bindings: SlotBindings;
};
