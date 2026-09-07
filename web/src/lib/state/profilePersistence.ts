import { get as idbGet, set as idbSet } from 'idb-keyval';
import type {
  ProfileSlotId,
  ProfileSlotsStore,
  SavedProfile,
} from '../types/keymap';

export const PROFILES_KEY = 'keybinds-profiles';
export const PROFILE_SLOTS_KEY = 'keybinds-profile-slots';
export const ACTIVE_PROFILE_KEY = 'keybinds-active-profile';

export async function getProfileSlots(): Promise<ProfileSlotsStore> {
  return (await idbGet<ProfileSlotsStore>(PROFILE_SLOTS_KEY)) ?? {};
}

export async function setProfileSlots(slots: ProfileSlotsStore): Promise<void> {
  await idbSet(PROFILE_SLOTS_KEY, slots);
}

export async function getActiveProfileId(): Promise<ProfileSlotId | undefined> {
  return idbGet<ProfileSlotId>(ACTIVE_PROFILE_KEY);
}

export async function setActiveProfileId(slotId: ProfileSlotId): Promise<void> {
  await idbSet(ACTIVE_PROFILE_KEY, slotId);
}

export async function getSavedProfiles(): Promise<SavedProfile[]> {
  return (await idbGet<SavedProfile[]>(PROFILES_KEY)) ?? [];
}

export async function saveNamedProfiles(profiles: SavedProfile[]): Promise<void> {
  await idbSet(PROFILES_KEY, profiles);
}

export async function clearDraftKey(): Promise<void> {
  await idbSet('keybinds-draft', undefined);
}
