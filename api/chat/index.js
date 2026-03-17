import jwt from 'jsonwebtoken';
import { getPool } from '../_lib/db.js';
import { decrypt } from '../_lib/crypto.js';
import { buildChatSystemPrompt, callAIChat } from '../_lib/ai.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const { messages, projectData, quote, quoteId } = req.body;

    const pool = getPool();
    const { rows } = await pool.query('SELECT gemini_api_key FROM profiles WHERE id = $1', [decoded.userId]);
    if (!rows[0]?.gemini_api_key) return res.status(400).json({ error: 'Chave API não configurada.' });

    const apiKey = decrypt(rows[0].gemini_api_key);
    const provider = req.body.aiProvider || 'gemini';
    const systemPrompt = buildChatSystemPrompt(projectData, quote);

    const content = await callAIChat(provider, apiKey, systemPrompt, messages);

    // Save messages
    const lastUserMsg = messages[messages.length - 1];
    if (quoteId) {
      if (lastUserMsg?.role === 'user') {
        await pool.query('INSERT INTO chat_messages (quote_id, role, content) VALUES ($1, $2, $3)', [quoteId, 'user', lastUserMsg.content]);
      }
      if (content) {
        await pool.query('INSERT INTO chat_messages (quote_id, role, content) VALUES ($1, $2, $3)', [quoteId, 'assistant', content]);
      }
    }

    res.json({ content });
  } catch (err) {
    console.error('Chat error:', err);
    if (!res.headersSent) {
      if (err.message === 'RATE_LIMIT') return res.status(429).json({ error: 'Limite de requisições atingido.' });
      if (err.message === 'INVALID_KEY') return res.status(401).json({ error: 'Chave API inválida.' });
      res.status(500).json({ error: 'Erro no chat.' });
    }
  }
}
