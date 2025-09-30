// Vercel Serverless Function (CommonJS)
module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, userId } = req.body || {};
    if (!action) {
      return res.status(400).json({ error: 'Missing "action" in body' });
    }

    const VOICEFLOW_API_KEY   = process.env.VOICEFLOW_API_KEY;    // set in Vercel
    const VOICEFLOW_VERSION_ID = process.env.VOICEFLOW_VERSION_ID; // set in Vercel

    if (!VOICEFLOW_API_KEY)   return res.status(500).json({ error: 'Missing VOICEFLOW_API_KEY' });
    if (!VOICEFLOW_VERSION_ID) return res.status(500).json({ error: 'Missing VOICEFLOW_VERSION_ID' });

    const uid = userId || ('anon_' + Math.random().toString(36).slice(2, 9));
    const url = `https://general-runtime.voiceflow.com/state/user/${encodeURIComponent(uid)}/interact`;

    const vfRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: VOICEFLOW_API_KEY,    // Voiceflow expects the API key here
        'Content-Type': 'application/json',
        versionID: VOICEFLOW_VERSION_ID
      },
      body: JSON.stringify({ action })
    });

    // Responses can be empty or plain text—handle robustly
    const text = await vfRes.text();
    let data;
    try { data = text ? JSON.parse(text) : []; } catch { data = []; }

    return res.status(vfRes.status).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};
