import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const fixturePath = resolve(root, 'fixtures/fixture_all.json');
const outputPath = resolve(root, 'web/public/programs.json');
const bundledOutputPath = resolve(root, 'web/src/lib/catalog/programs.json');
const programIconsDir = resolve(root, 'web/public/i/program-icons');
const sourceIconsDir = resolve(root, 'media/program_icons');
const fallbackIcon = 'i/ball.svg';

const fixture = JSON.parse(readFileSync(fixturePath, 'utf-8'));

const programs = [];
const commands = {};

function resolveProgramIcon(iconField) {
  const filename = basename(iconField);
  const pngAlternative = filename.replace(/\.ico$/i, '.png');
  const pngPath = resolve(programIconsDir, pngAlternative);

  if (existsSync(pngPath)) {
    return `i/program-icons/${pngAlternative}`;
  }

  const sourcePath = resolve(sourceIconsDir, filename);
  const targetPath = resolve(programIconsDir, filename);

  if (existsSync(sourcePath)) {
    return `i/program-icons/${filename}`;
  }

  if (existsSync(targetPath)) {
    return `i/program-icons/${filename}`;
  }

  return fallbackIcon;
}

const HIDDEN_PROGRAMS = new Set(['testprog', 'testprog0']);

for (const entry of fixture) {
  if (entry.model === 'keymap.program') {
    const slug = entry.fields.slug;
    if (HIDDEN_PROGRAMS.has(slug)) {
      continue;
    }
    programs.push({
      slug,
      title: entry.fields.title,
      icon: resolveProgramIcon(entry.fields.icon),
      site: entry.fields.site,
      settingsFileInfo: entry.fields.settings_file_info ?? '',
      supported: slug === 'pycharm' || slug === 'vscode',
    });
  }

  if (entry.model === 'keymap.command') {
    const program = entry.fields.program;
    commands[program] ??= [];
    commands[program].push({
      id: entry.fields.name,
      shortName: entry.fields.short_name,
      iconPath: entry.fields.icon
        ? `icons/pycharm/${basename(entry.fields.icon)}`
        : undefined,
    });
  }
}

programs.push({
  slug: 'vscode',
  title: 'VS Code',
  icon: fallbackIcon,
  site: 'https://code.visualstudio.com/',
  settingsFileInfo: 'Экспорт: Command Palette → Preferences: Open Default Keyboard Shortcuts (JSON)',
  supported: true,
});

const catalogJson = JSON.stringify({ programs, commands }, null, 2);

writeFileSync(outputPath, catalogJson, 'utf-8');
writeFileSync(bundledOutputPath, catalogJson, 'utf-8');

console.log(`Wrote ${outputPath}`);
console.log(`Wrote ${bundledOutputPath}`);
console.log(`Programs: ${programs.length}, PyCharm commands: ${commands.pycharm?.length ?? 0}`);
