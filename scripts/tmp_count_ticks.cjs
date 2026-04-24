const fs = require('fs');
const t = fs.readFileSync('src/ssq/app.js', 'utf8');
console.log((t.match(/`/g) || []).length);
