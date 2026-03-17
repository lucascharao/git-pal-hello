import { getPool } from '../_lib/db.js';
import { encrypt } from '../_lib/crypto.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'change-me-in-production');
    const { apiKey } = req.body;
    if (!apiKey?.trim()) return res.status(400).json({ error: 'Chave API é obrigatória.' });

    const encryptedKey = encrypt(apiKey.trim());
    const pool = getPool();
    await pool.query('UPDATE profiles SET gemini_api_key = $1, updated_at = now() WHERE id = $2', [encryptedKey, decoded.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('API key save error:', err);
    res.status(500).json({ error: 'Erro ao salvar chave API.' });
  }
}
