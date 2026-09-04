const { rmSync } = require('node:fs');
const { resolve } = require('node:path');

rmSync(resolve(__dirname, '../build'), { recursive: true, force: true });
console.log('Build output removed.');
