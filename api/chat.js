// Hybrid Vercel Serverless endpoint for Dev-AI Concierge Studio
// Set GROQ_API_KEY or GEMINI_API_KEY in Vercel Environment Variables to enable live LLM mode;
// without a key configured, cleanly signals client to run zero-latency local grounded RAG.

const PORTFOLIO_FACTS = `You are Dev-AI, the grounded career concierge for Dev Patel (Ahmedabad, India).
Rules: Answer ONLY from verified facts below. Never invent companies, scores, or experience. Keep answers concise (<= 90 words), scannable, and practical for technical recruiters.
Facts:
- Education: B.Tech CSE, Parul University (2022-2025); Diploma CE, Growmore Foundation (2019-2022).
- Experience: Data Science Intern, Prodigy InfoTech (May-Jun 2026), Outstanding Mentor Remarks, audited 500,000+ raw multi-source records cutting noise by 30%, built K-Means & Decision Tree cohort models.
- GenAI & Agents: Multi-PDF Vector RAG Suite (Gemini embeddings, recursive 1000/150 chunking, top-k=4 page citations); AI Travel Planner Agent (Groq LPU ~410ms + Serper live web search ~280ms, LangGraph); enterprise AI chatbot at Nasscom thingQbator (Sep 2026).
- Machine Learning: 22-class Crop Recommendation classifier reaching 99.1% 5-fold CV (GaussianNB, XGBoost 99.0%, fold-isolated StandardScaler preventing data leakage, sub-2.1ms CPU inference), IQR/Z-score preprocessing, Boston Housing regression.
- BI & SQL: Power BI Star Schema over 10,420+ e-commerce orders (INR 48.6L revenue, 31.4% avg margin, DAX YoY); 6-table 3NF MySQL/PostgreSQL schema with recursive CTEs, DENSE_RANK, LAG, COALESCE.
- Credentials & Logistics: TATA GenAI Analytics, Deloitte Data Analytics, TechWar 2026, 34+ public GitHub repos (github.com/Devpatel7777). Immediate joiner, relocation ready (India/Remote). Contact: devpatel846211@gmail.com | +91 93289 77322.`;

const hits = new Map();
function allowIp(ip) {
  const now = Date.now(), rec = hits.get(ip);
  if (!rec || now - rec.t > 60000) { hits.set(ip, { c: 1, t: now }); if (hits.size > 500) hits.clear(); return true; }
  if (rec.c >= 25) return false;
  rec.c += 1;
  return true;
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  if (!allowIp(ip)) return res.status(200).json({ live: false, mode: 'rate-limited' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const q = String(body?.question || '').trim().slice(0, 420);
  const lens = ['aiml', 'ds', 'analyst'].includes(body?.lens) ? body.lens : 'aiml';
  if (!q) return res.status(400).json({ error: 'Empty question' });

  const promptUser = `Recruiter evaluation lens: ${lens.toUpperCase()}.\nRecruiter query: ${q}`;
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!groqKey && !geminiKey) return res.status(200).json({ live: false, mode: 'local-grounded' });

  try {
    if (groqKey) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          temperature: 0.25,
          max_tokens: 240,
          messages: [{ role: 'system', content: PORTFOLIO_FACTS }, { role: 'user', content: promptUser }]
        }),
        signal: AbortSignal.timeout(4500)
      });
      if (r.ok) {
        const data = await r.json();
        const answer = data?.choices?.[0]?.message?.content?.trim();
        if (answer) return res.status(200).json({ live: true, model: 'groq-llama-3.1', answer });
      }
    }
    if (geminiKey) {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: PORTFOLIO_FACTS }] },
          contents: [{ role: 'user', parts: [{ text: promptUser }] }],
          generationConfig: { temperature: 0.25, maxOutputTokens: 240 }
        }),
        signal: AbortSignal.timeout(4500)
      });
      if (r.ok) {
        const data = await r.json();
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (answer) return res.status(200).json({ live: true, model: 'gemini-2.0-flash', answer });
      }
    }
  } catch (_) {}

  return res.status(200).json({ live: false, mode: 'fallback' });
};
