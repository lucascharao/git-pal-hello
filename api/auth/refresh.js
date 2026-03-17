import jwt from 'jsonwebtoken';
import { generateTokens } from '../_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token é obrigatório.' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'change-me-in-production');
    if (decoded.type !== 'refresh') return res.status(401).json({ error: 'Token inválido.' });

    const tokens = generateTokens(decoded.userId, decoded.email);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Refresh token inválido ou expirado.' });
  }
}
