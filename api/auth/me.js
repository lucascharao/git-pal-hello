import { getPool } from '../_lib/db.js';
import { authMiddleware } from '../_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Manual auth check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não fornecido' });

  const jwt = await import('jsonwebtoken');
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'change-me-in-production');
    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT id, email, full_name, gemini_api_key IS NOT NULL as has_api_key, whatsapp FROM profiles WHERE id = $1",
      [decoded.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const user = rows[0];
    res.json({ id: user.id, email: user.email, fullName: user.full_name, hasApiKey: user.has_api_key, whatsapp: user.whatsapp });
  } catch (err) {
    res.status(401).json({ error: 'Token inválido.' });
  }
}
