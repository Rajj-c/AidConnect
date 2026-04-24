require('dotenv').config({ path: '.env' });
const { matchVolunteers } = require('./src/ai/flows/ngo-ai-match-volunteers.ts');
console.log(matchVolunteers);
