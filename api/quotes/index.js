import jwt from 'jsonwebtoken';
import { getPool } from '../_lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT q.id, q.client_value, q.client_size, q.complexity, q.implementation_fee, q.recurring_fee, q.created_at,
              COALESCE((SELECT json_agg(json_build_object('recommendation', co.recommendation, 'created_at', co.created_at)) FROM counter_offers co WHERE co.quote_id = q.id), '[]') as counter_offers,
              (SELECT COUNT(*) FROM chat_messages cm WHERE cm.quote_id = q.id)::int as chat_message_count
       FROM quotes q WHERE q.user_id = $1 ORDER BY q.created_at DESC`,
      [decoded.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('List quotes error:', err);
    res.status(500).json({ error: 'Erro ao buscar orçamentos.' });
  }
}
