const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/jotaf/.gemini/antigravity/brain/a7edad65-04be-4539-aa3d-c4c1d7c8daef/.system_generated/steps/1174/output.txt', 'utf8'));
data.forEach(card => console.log(card.name + ' [' + (card.closed ? 'closed' : 'open') + ']'));
