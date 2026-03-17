import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';
import { generateTokens, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, whatsapp } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios.' });
    }

    const existing = await pool.query('SELECT id FROM profiles WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Este email já está cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO profiles (email, password_hash, full_name, whatsapp)
       VALUES ($1, $2, $3, $4) RETURNING id, email, full_name`,
      [email, passwordHash, fullName, whatsapp || '']
    );

    const user = rows[0];
    await pool.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [user.id, 'user']
    );

    const tokens = generateTokens(user.id, user.email);

    res.status(201).json({
      user: { id: user.id, email: user.email, fullName: user.full_name },
      ...tokens,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Erro ao criar conta.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const { rows } = await pool.query(
      'SELECT id, email, full_name, password_hash FROM profiles WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Email ou senha incorretos.' });
    }

    const tokens = generateTokens(user.id, user.email);

    res.json({
      user: { id: user.id, email: user.email, fullName: user.full_name },
      ...tokens,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erro ao fazer login.' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token é obrigatório.' });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(refreshToken, process.env.JWT_SECRET || 'change-me-in-production');

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Token inválido.' });
    }

    const tokens = generateTokens(decoded.userId, decoded.email);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Refresh token inválido ou expirado.' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, full_name, gemini_api_key IS NOT NULL as has_api_key, whatsapp FROM profiles WHERE id = $1',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const user = rows[0];
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      hasApiKey: user.has_api_key,
      whatsapp: user.whatsapp,
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário.' });
  }
});

router.post('/api-key', authMiddleware, async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey?.trim()) {
      return res.status(400).json({ error: 'Chave API é obrigatória.' });
    }

    await pool.query(
      'UPDATE profiles SET gemini_api_key = $1, updated_at = now() WHERE id = $2',
      [apiKey.trim(), req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('API key save error:', err);
    res.status(500).json({ error: 'Erro ao salvar chave API.' });
  }
});

export default router;
