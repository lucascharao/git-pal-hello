import jwt from 'jsonwebtoken';
import { getPool } from '../_lib/db.js';
import { decrypt } from '../_lib/crypto.js';
import { buildQuotePrompt, callAIProvider, extractJSON } from '../_lib/ai.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const { projectData, aiProvider = 'gemini' } = req.body;
    if (!projectData) return res.status(400).json({ error: 'Dados do projeto são obrigatórios.' });

    const pool = getPool();
    const { rows } = await pool.query('SELECT gemini_api_key FROM profiles WHERE id = $1', [decoded.userId]);
    if (!rows[0]?.gemini_api_key) return res.status(400).json({ error: 'Chave API não configurada.' });

    const apiKey = decrypt(rows[0].gemini_api_key);
    const prompt = buildQuotePrompt(projectData);
    const content = await callAIProvider(aiProvider, apiKey, prompt);
    if (!content) throw new Error('Sem resposta da IA.');

    const quote = extractJSON(content);

    const { rows: saved } = await pool.query(
      `INSERT INTO quotes (user_id, client_value, client_size, complexity, urgency, integration_needs, security_level, team_seniority, support_level, duration, team_size, desired_margin, annual_revenue, process_to_optimize, time_spent, people_involved, estimated_loss, tools, implementation_fee, recurring_fee, reasoning)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING id`,
      [decoded.userId, projectData.clientValue, projectData.clientSize, projectData.complexity, projectData.urgency, projectData.integrationNeeds, projectData.securityLevel, projectData.teamSeniority, projectData.supportLevel, projectData.duration, projectData.teamSize, projectData.desiredMargin, projectData.annualRevenue, projectData.processToOptimize, projectData.timeSpent, projectData.peopleInvolved, projectData.estimatedLoss, JSON.stringify(projectData.tools || []), quote.implementationFee, quote.recurringFee, quote.reasoning]
    );

    res.json({ ...quote, quoteId: saved[0].id });
  } catch (err) {
    console.error('Generate quote error:', err);
    if (err.message === 'RATE_LIMIT') return res.status(429).json({ error: 'Limite de requisições atingido.' });
    if (err.message === 'INVALID_KEY') return res.status(401).json({ error: 'Chave API inválida.' });
    res.status(500).json({ error: err.message || 'Erro ao gerar orçamento.' });
  }
}
