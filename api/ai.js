export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { model, messages, system, max_tokens } = req.body;
    const contents = [];
    if (system) contents.push({ role: "user", parts: [{ text: `SYSTEM: ${system}` }] });
    messages.forEach(m => contents.push({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: max_tokens || 2000 } })
      }
    );
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Return in Anthropic-compatible shape so App.jsx needs no changes
    res.status(200).json({ content: [{ type: "text", text }] });
  } catch (e) {
    res.status(500).json({ error: { message: e.message } });
  }
}
