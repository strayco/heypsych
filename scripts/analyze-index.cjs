const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/resources-index.json', 'utf8'));
console.log('Resources in index:', data.resources.length);
console.log('Active:', data.resources.filter(r => r.status === 'active').length);
console.log('With metadata.category:', data.resources.filter(r => r.metadata && r.metadata.category).length);
console.log('With content.category:', data.resources.filter(r => r.content && r.content.category).length);
console.log('Neither:', data.resources.filter(r => (!r.metadata || !r.metadata.category) && (!r.content || !r.content.category)).length);
