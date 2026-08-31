import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');

const copies = [
  {
    from: resolve(root, 'media/pycharm_setting_files/1/Windows.xml'),
    to: resolve(root, 'test-fixtures/Windows.xml'),
  },
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
  {
    from: resolve(root, 'test-fixtures/Windows.xml'),
    to: resolve(root, 'web/public/defaults/pycharm-windows.xml'),
  },
  {
    from: resolve(root, 'test-fixtures/bash-emacs.inputrc'),
    to: resolve(root, 'web/public/defaults/bash-emacs.inputrc'),
  },
  {
    from: resolve(root, 'fixtures/vim-default.json'),
    to: resolve(root, 'test-fixtures/vim-default.json'),
  },
  {
    from: resolve(root, 'fixtures/vim-recipes.json'),
    to: resolve(root, 'test-fixtures/vim-recipes.json'),
  },
  {
    from: resolve(root, 'fixtures/vim-default.json'),
    to: resolve(root, 'web/public/defaults/vim-default.json'),
  },
  {
    from: resolve(root, 'fixtures/vim-recipes.json'),
    to: resolve(root, 'web/public/defaults/vim-recipes.json'),
  },
];

const bashProgramIcon = resolve(
  root,
  'media/pycharm_command_icons/ActivateTerminalToolWindow.svg',
);
const bashProgramIconDest = resolve(root, 'media/program_icons/bash.svg');
if (existsSync(bashProgramIcon) && !existsSync(bashProgramIconDest)) {
  cpSync(bashProgramIcon, bashProgramIconDest);
  console.log(`copied ${bashProgramIcon} -> ${bashProgramIconDest}`);
}

const bashIconDir = resolve(root, 'web/public/icons/bash');
const pycharmIconDir = resolve(root, 'media/pycharm_command_icons');
const bashCustomIconDir = resolve(root, 'media/bash_command_icons');
mkdirSync(bashIconDir, { recursive: true });

const bashIconSources = {
  'EditorLineStart.png': 'EditorLineStart.png',
  'EditorLineEnd.png': 'EditorLineEnd.png',
  'EditorRight.png': 'EditorRight.png',
  'EditorLeft.png': 'EditorLeft.png',
  'EditorNextWord.png': 'EditorNextWord.png',
  'EditorPreviousWord.png': 'EditorPreviousWord.png',
  'EditorDown.png': 'EditorDown.png',
  'EditorUp.png': 'EditorUp.png',
  'EditorScrollTop.png': 'EditorScrollTop.png',
  'EditorScrollDown.png': 'EditorScrollDown.png',
  '$Delete.svg': '$Delete.svg',
  'EditorBackSpace.png': 'EditorBackSpace.png',
  'EditorDeleteToLineEnd.png': 'EditorDeleteToLineEnd.png',
  'EditorDeleteToLineStart.png': 'EditorDeleteToLineStart.png',
  'EditorDeleteToWordEnd.png': 'EditorDeleteToWordEnd.png',
  'EditorDeleteToWordStart.png': 'EditorDeleteToWordStart.png',
  '$Paste.png': '$Paste.png',
  'EditorPasteSimple.png': 'EditorPasteSimple.png',
  '$Undo.png': '$Undo.png',
  'Replace.png': 'Replace.png',
  'EditorToggleCase.svg': 'EditorToggleCase.svg',
  'HippieCompletion.png': 'HippieCompletion.png',
  'HippieBackwardCompletion.png': 'HippieBackwardCompletion.png',
  'InsertLiveTemplate.png': 'InsertLiveTemplate.png',
  'ExecuteInPyConsoleAction.png': 'ExecuteInPyConsoleAction.png',
  'Stop.svg': 'Stop.svg',
  'Pause.svg': 'Pause.svg',
  'Find.svg': 'Find.svg',
  'FindNext.png': 'FindNext.png',
  'FindPrevious.png': 'FindPrevious.png',
  'Console.History.Browse.svg': 'Console.History.Browse.svg',
  'SearchEverywhere.png': 'SearchEverywhere.png',
  'CommentByLineComment.png': 'CommentByLineComment.png',
  'GotoLine.png': 'GotoLine.png',
  'EditorDeleteLine.png': 'EditorDeleteLine.png',
  'EditorSelectLine.png': 'EditorSelectLine.png',
  'ActivateTerminalToolWindow.svg': 'ActivateTerminalToolWindow.svg',
  '$Redo.svg': '$Redo.svg',
};

for (const [filename, sourceName] of Object.entries(bashIconSources)) {
  const custom = resolve(bashCustomIconDir, filename);
  const source = resolve(pycharmIconDir, sourceName);
  const dest = resolve(bashIconDir, filename);
  const from = existsSync(custom) ? custom : source;
  if (!existsSync(from)) {
    console.warn(`skip missing bash icon: ${from}`);
    continue;
  }
  cpSync(from, dest);
}

const vimProgramIcon = resolve(root, 'media/pycharm_command_icons/ActivateTerminalToolWindow.svg');
const vimProgramIconDest = resolve(root, 'media/program_icons/vim.svg');
if (existsSync(vimProgramIcon) && !existsSync(vimProgramIconDest)) {
  cpSync(vimProgramIcon, vimProgramIconDest);
  console.log(`copied ${vimProgramIcon} -> ${vimProgramIconDest}`);
}

const vimIconDir = resolve(root, 'web/public/icons/vim');
mkdirSync(vimIconDir, { recursive: true });
const vimIconSources = {
  ...bashIconSources,
  '$Copy.png': '$Copy.png',
  'SaveAll.svg': 'SaveAll.svg',
};
for (const [filename, sourceName] of Object.entries(vimIconSources)) {
  const source = resolve(pycharmIconDir, sourceName);
  const dest = resolve(vimIconDir, filename);
  if (!existsSync(source)) {
    console.warn(`skip missing vim icon: ${source}`);
    continue;
  }
  cpSync(source, dest);
}

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
