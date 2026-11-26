'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const backend = path.join(__dirname, '..');
const frontend = path.join(backend, '..', 'frontend');
let count = 0;

function check(file) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  count++;
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && file.endsWith('.js')) check(file);
  }
}

check(path.join(backend, 'server.js'));
walk(path.join(backend, 'src'));
if (fs.existsSync(path.join(frontend, 'app.js'))) {
  walk(frontend);
} else {
  console.warn('Frontend original ausente: copie public/ para frontend/. Verificação do frontend não realizada.');
}
console.log(`Sintaxe verificada: ${count} arquivo(s) JavaScript.`);
