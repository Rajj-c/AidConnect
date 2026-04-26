const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

async function test() {
  const prompt = "Rank top 3 volunteers. Return array.";
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.1, 
        maxOutputTokens: 800, 
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              rank: { type: "INTEGER" },
              volunteerIndex: { type: "INTEGER", description: "1-based index" },
              reasons: { type: "ARRAY", items: { type: "STRING" } },
              dispatchMessage: { type: "STRING" }
            },
            required: ["rank", "volunteerIndex", "reasons", "dispatchMessage"]
          }
        }
      }
    })
  });
  const text = await res.text();
  console.log(res.status, text.substring(0, 500));
}
test();
