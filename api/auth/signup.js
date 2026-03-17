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
    const { email, password, fullName, whatsapp } = req.body;
    if (!email || !password || !fullName) return res.status(400).json({ error: 'Email, senha e nome são obrigatórios.' });

    const pool = getPool();
    const existing = await pool.query('SELECT id FROM profiles WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Este email já está cadastrado.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO profiles (email, password_hash, full_name, whatsapp) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name',
      [email, passwordHash, fullName, whatsapp || '']
    );
    const user = rows[0];
    await pool.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [user.id, 'user']);

    const tokens = generateTokens(user.id, user.email);
    res.status(201).json({ user: { id: user.id, email: user.email, fullName: user.full_name }, ...tokens });
  } catch (err) {
    console.error('Signup error:', err.message, err.stack);
    res.status(500).json({ error: 'Erro ao criar conta.', detail: err.message });
  }
}
