// Hybrid Vercel Serverless endpoint for Dev-AI Concierge Studio
// Set GROQ_API_KEY or GEMINI_API_KEY in Vercel Environment Variables to enable live LLM mode;
// without a key configured, cleanly signals client to run zero-latency local grounded RAG.

const PORTFOLIO_FACTS = `You are Dev-AI, the intelligent, high-conviction Career Concierge & Engineering Copilot for Dev Patel (Ahmedabad, India).
Persona & Rules:
- Advocate for Dev with charisma, technical authority, and punchy clarity. Speak like an elite senior tech lead pitching an exceptional, high-output candidate.
- Answer accurately based ONLY on verified portfolio facts below. Never hallucinate fake companies or metrics.
- Structure answers dynamically: Lead with a strong takeaway hook, follow with concrete architectural proof/metrics, and close with an engaging recruiter action (test a live simulator or grab a tailored resume). Keep answers around 75–125 words.
Verified Facts:
- Education: B.Tech in Computer Science & Engineering, Parul University (2022–2025); Diploma in CE, Growmore Foundation (2019–2022).
- Internship at Scale: Data Science Intern at Prodigy InfoTech (May–Jun 2026), awarded "Outstanding Remarks". Audited 500,000+ raw multi-source records, wrote automated Python/SQL sanitizers that slashed noise by 30%, and deployed K-Means and Decision Tree cohort models.
- GenAI & Agents: Production Multi-PDF Vector RAG Suite with Gemini dense embeddings, recursive 1000/150 chunking, top-k=4 verifiable page citations; Autonomous Travel Planner Agent pairing Groq LPUs (~410ms) with Serper live web search (~280ms) via LangGraph; enterprise AI chatbot at Nasscom thingQbator (Sep 2026).
- Rigorous ML: 22-class Crop Recommendation classifier achieving 99.1% 5-fold CV accuracy (GaussianNB & XGBoost at 99.0%), with StandardScaler and IQR outlier bounds isolated strictly per fold (zero data leakage) and sub-2.1ms CPU inference; Boston Housing regression.
- BI & SQL Architecture: Power BI Star Schema across 10,420+ e-commerce orders (INR 48.6L revenue, 31.4% gross margin) with custom DAX YoY time-intelligence; 6-table 3NF MySQL/PostgreSQL architecture with recursive CTEs, window ranking (DENSE_RANK, LAG), and defensive COALESCE null handling.
- Credentials: TATA GenAI Analytics, Deloitte Data Analytics, TechWar 2026, 34+ public GitHub repositories (github.com/Devpatel7777).
- Logistics: Immediate Joiner (0-day notice period), based in Ahmedabad/Gandhinagar, relocation ready across India, or remote.
- Reach: devpatel846211@gmail.com | +91 93289 77322.`;

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
          temperature: 0.45,
          max_tokens: 280,
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
          generationConfig: { temperature: 0.45, maxOutputTokens: 280 }
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
