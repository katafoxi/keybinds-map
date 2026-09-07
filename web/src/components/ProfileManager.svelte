<script lang="ts">
  import { onMount } from 'svelte';
  import { getSavedProfiles, keymap } from '../lib/state/keymapStore';
  import type { SavedProfile } from '../lib/types/keymap';

  let profileName = '';
  let profiles: SavedProfile[] = [];

  onMount(async () => {
    profiles = await getSavedProfiles();
  });

  async function refreshProfiles() {
    profiles = await getSavedProfiles();
  }

  async function saveProfile() {
    if (!profileName.trim()) {
      return;
    }
    await keymap.getState().saveProfile(profileName.trim());
    profileName = '';
    await refreshProfiles();
  }

  async function loadProfile(profile: SavedProfile) {
    await keymap.getState().loadProfile(profile);
  }

  async function deleteProfile(id: string) {
    await keymap.getState().deleteProfile(id);
    await refreshProfiles();
  }
</script>

<section class="profiles no-print">
  <h3>Локальные профили</h3>
  <div class="profile-form">
    <input bind:value={profileName} placeholder="Название профиля" />
    <button type="button" on:click={saveProfile}>Сохранить</button>
  </div>
  {#if profiles.length === 0}
    <p class="hint">Профили хранятся в IndexedDB этого браузера.</p>
  {:else}
    <ul>
      {#each profiles as profile (profile.id)}
        <li>
          <button type="button" on:click={() => loadProfile(profile)}>
            {profile.name}
          </button>
          <button type="button" class="danger" on:click={() => deleteProfile(profile.id)}>
            Удалить
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .profiles {
    margin-top: 1rem;
    font-size: 12px;
  }

  .profile-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .profile-form input {
    flex: 1;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .danger {
    color: #b00020;
  }

  .hint {
    color: #666;
  }
</style>
