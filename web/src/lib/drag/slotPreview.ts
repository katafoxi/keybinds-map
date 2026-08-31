import type { CommandRef } from '../types/keymap';
import { assetUrl } from '../assets';

let activeSlot: HTMLElement | null = null;

function hideOccupants(slotEl: HTMLElement): void {
  for (const chip of slotEl.querySelectorAll('.command_description:not(.drag-preview-ghost)')) {
    (chip as HTMLElement).style.visibility = 'hidden';
  }
}

function restoreOccupants(slotEl: HTMLElement): void {
  for (const chip of slotEl.querySelectorAll('.command_description:not(.drag-preview-ghost)')) {
    (chip as HTMLElement).style.visibility = '';
  }
}

function buildPreview(command: CommandRef): HTMLElement {
  const root = document.createElement('div');
  root.className = 'command_description drag-preview drag-preview-ghost';

  const descr = document.createElement('div');
  descr.className = 'descr';

  if (command.icon) {
    const img = document.createElement('img');
    img.className = 'icons';
    img.src = assetUrl(command.icon);
    img.alt = '';
    descr.appendChild(img);
  }

  descr.append(command.shortName);
  root.appendChild(descr);
  return root;
}

export function showSlotPreview(slotEl: HTMLElement, command: CommandRef): void {
  if (activeSlot === slotEl && slotEl.querySelector('.drag-preview-ghost')) {
    return;
  }
  clearSlotPreview();
  activeSlot = slotEl;
  slotEl.classList.add('drop-target');
  hideOccupants(slotEl);
  slotEl.appendChild(buildPreview(command));
}

export function clearSlotPreview(): void {
  if (!activeSlot) {
    return;
  }
  activeSlot.querySelector('.drag-preview-ghost')?.remove();
  activeSlot.classList.remove('drop-target');
  restoreOccupants(activeSlot);
  activeSlot = null;
}
