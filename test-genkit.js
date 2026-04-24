require('dotenv').config({ path: '.env' });
const { genkit } = require('genkit');
const { googleAI } = require('@genkit-ai/google-genai');

const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

async function run() {
  try {
    const res = await ai.generate({ prompt: 'Say OK' });
    console.log('SUCCESS:', res.text);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}
run();
