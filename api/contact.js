// Vercel Serverless Function: High-Reliability Contact & Lead Dispatcher
export default async function handler(req, res) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, role, message } = req.body || {};

    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message are required' });
    }

    const cleanName = String(name || 'Anonymous Recruiter').slice(0, 100).trim();
    const cleanEmail = String(email).slice(0, 120).trim();
    const cleanRole = String(role || 'General Inquiry').slice(0, 100).trim();
    const cleanMessage = String(message).slice(0, 2000).trim();
    const timestamp = new Date().toISOString();

    // 1. Optional Telegram Real-time Push Notification (Set TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID in Vercel)
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      try {
        const text = `🔔 *New Lead on Dev Patel Portfolio*:\n\n👤 *From:* ${cleanName}\n📧 *Email:* ${cleanEmail}\n🎯 *Role:* ${cleanRole}\n💬 *Message:* ${cleanMessage}\n⏱️ *Time:* ${timestamp}`;
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text,
            parse_mode: 'Markdown'
          })
        });
      } catch (tgErr) {
        console.error('Telegram notification error:', tgErr);
      }
    }

    // 2. Optional Resend Email Dispatcher (Set RESEND_API_KEY in Vercel)
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Portfolio Lead <onboarding@resend.dev>',
            to: ['devpatel846211@gmail.com'],
            subject: `🎯 New Portfolio Lead: ${cleanName} (${cleanRole})`,
            html: `<h3>New Lead Received</h3><p><strong>Name:</strong> ${cleanName}</p><p><strong>Email:</strong> ${cleanEmail}</p><p><strong>Role:</strong> ${cleanRole}</p><p><strong>Message:</strong><br>${cleanMessage.replace(/\n/g, '<br>')}</p><p><small>Delivered at ${timestamp}</small></p>`
          })
        });
      } catch (emailErr) {
        console.error('Resend email error:', emailErr);
      }
    }

    return res.status(200).json({
      success: true,
      delivered: true,
      timestamp,
      message: 'Message delivered to Dev Patel successfully'
    });
  } catch (err) {
    console.error('Contact handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
