<script lang="ts">
  import { onMount } from 'svelte';
  import {
    keymap,
  } from '../lib/state/keymapStore';
  import {
    PROFILE_SLOT_IDS,
    PROFILE_SLOT_LABELS,
    type ProfileSlotId,
  } from '../lib/types/keymap';

  let filled: Record<'custom1' | 'custom2', boolean> = {
    custom1: false,
    custom2: false,
  };

  async function refreshFilled() {
    filled = await keymap.getState().getCustomSlotsFilled();
  }

  onMount(refreshFilled);

  async function switchProfile(slotId: ProfileSlotId) {
    if (slotId !== 'standard' && !filled[slotId]) {
      return;
    }
    await keymap.getState().switchProfile(slotId);
    await refreshFilled();
  }

  async function copyProfile() {
    const target = await keymap.getState().copyCurrentProfile();
    if (target) {
      await refreshFilled();
    }
  }

  $: activeId = $keymap.activeProfileId;
  $: canCopy = Object.keys($keymap?.bindings ?? {}).length > 0;
</script>

<div class="profile-switcher">
  <span class="label">Профиль:</span>
  {#each PROFILE_SLOT_IDS as id}
    {@const label = PROFILE_SLOT_LABELS[id]}
    {@const isCustom = id !== 'standard'}
    {@const isEmpty = isCustom && !filled[id]}
    <button
      type="button"
      class:active={activeId === id}
      class:empty={isEmpty}
      disabled={isEmpty}
      title={isEmpty ? 'Пусто — нажмите «Скопировать профиль»' : label}
      on:click={() => switchProfile(id)}
    >
      {label}
    </button>
  {/each}
  <button type="button" class="copy-btn" on:click={copyProfile} disabled={!canCopy}>
    Скопировать профиль
  </button>
</div>

<style>
  .profile-switcher {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.35rem;
    margin-left: 0.5rem;
    padding-left: 0.75rem;
    border-left: 1px solid #ccc;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .label {
    font-size: 12px;
    color: #555;
    margin-right: 0.15rem;
  }

  button {
    font-size: 12px;
    padding: 0.35rem 0.65rem;
    cursor: pointer;
    border: 1px solid #888;
    background: #f4f4f4;
    border-radius: 4px;
  }

  button.active {
    background: #1c6ea4;
    color: #fff;
    border-color: #1c6ea4;
  }

  button.empty:not(.active) {
    opacity: 0.45;
    cursor: not-allowed;
  }

  button.copy-btn {
    margin-left: 0.25rem;
    border-color: #14a421;
    background: #efffed;
  }

  button.copy-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
