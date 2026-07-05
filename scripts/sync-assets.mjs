import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');

const copies = [
  {
    from: resolve(root, 'media/pycharm_command_icons'),
    to: resolve(root, 'web/public/icons/pycharm'),
  },
  {
    from: resolve(root, 'media/program_icons'),
    to: resolve(root, 'web/public/i/program-icons'),
  },
  {
    from: resolve(root, 'assets/ui/logo.png'),
    to: resolve(root, 'web/public/i/logo.png'),
  },
  {
    from: resolve(root, 'assets/ui/ball.svg'),
    to: resolve(root, 'web/public/i/ball.svg'),
  },
  {
    from: resolve(root, 'assets/ui/favicon'),
    to: resolve(root, 'web/public/i/favicon'),
  },
];

for (const { from, to } of copies) {
  if (!existsSync(from)) {
    console.warn(`skip missing source: ${from}`);
    continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`copied ${from} -> ${to}`);
}

const ico = resolve(root, 'media/program_icons/PyCharm.ico');
const png = resolve(root, 'web/public/i/program-icons/PyCharm.png');
if (existsSync(ico)) {
  try {
    execSync(
      `python3 -c "from PIL import Image; Image.open('${ico}').save('${png}', format='PNG')"`,
      { stdio: 'inherit' },
    );
  } catch {
    console.warn('PyCharm.png not generated; install Pillow or copy manually');
  }
}

console.log('Asset sync complete.');
