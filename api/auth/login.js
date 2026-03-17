import bcrypt from 'bcryptjs';
import { getPool } from '../_lib/db.js';
import { generateTokens } from '../_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

    const pool = getPool();
    const { rows } = await pool.query('SELECT id, email, full_name, password_hash FROM profiles WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Email ou senha incorretos.' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email ou senha incorretos.' });

    const tokens = generateTokens(user.id, user.email);
    res.json({ user: { id: user.id, email: user.email, fullName: user.full_name }, ...tokens });
  } catch (err) {
    console.error('Login error:', err.message, err.stack);
    res.status(500).json({ error: 'Erro ao fazer login.', detail: err.message });
  }
}
