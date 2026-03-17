import jwt from 'jsonwebtoken';
import { getPool } from '../../_lib/db.js';
import { decrypt } from '../../_lib/crypto.js';
import { buildCounterOfferPrompt, callAIProvider, extractJSON } from '../../_lib/ai.js';

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
    const { quoteId } = req.query;
    const { originalQuote, counterOffer, projectData, aiProvider = 'gemini' } = req.body;

    const pool = getPool();
    const { rows } = await pool.query('SELECT gemini_api_key FROM profiles WHERE id = $1', [decoded.userId]);
    if (!rows[0]?.gemini_api_key) return res.status(400).json({ error: 'Chave API não configurada.' });

    const apiKey = decrypt(rows[0].gemini_api_key);
    const prompt = buildCounterOfferPrompt(originalQuote, counterOffer, projectData);
    const content = await callAIProvider(aiProvider, apiKey, prompt);
    const analysis = extractJSON(content);

    await pool.query(
      'INSERT INTO counter_offers (quote_id, client_implementation, client_recurring, recommendation, analysis, suggested_response, new_implementation_fee, new_recurring_fee) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [quoteId, counterOffer.implementation, counterOffer.recurring, analysis.recommendation, analysis.analysis, analysis.suggestedResponse, analysis.newOffer?.implementationFee || null, analysis.newOffer?.recurringFee || null]
    );

    res.json(analysis);
  } catch (err) {
    console.error('Counter offer error:', err);
    if (err.message === 'RATE_LIMIT') return res.status(429).json({ error: 'Limite atingido.' });
    if (err.message === 'INVALID_KEY') return res.status(401).json({ error: 'Chave API inválida.' });
    res.status(500).json({ error: err.message || 'Erro ao analisar.' });
  }
}
