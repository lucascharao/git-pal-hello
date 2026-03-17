import { Router } from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  buildQuotePrompt,
  buildCounterOfferPrompt,
  callAIProvider,
  extractJSON,
} from '../services/ai.js';
import { decrypt } from '../services/crypto.js';

const router = Router();

router.use(authMiddleware);

// Generate quote
router.post('/generate', async (req, res) => {
  try {
    const { projectData, aiProvider = 'gemini' } = req.body;

    if (!projectData) {
      return res.status(400).json({ error: 'Dados do projeto são obrigatórios.' });
    }

    // Get user's API key
    const { rows } = await pool.query(
      'SELECT gemini_api_key FROM profiles WHERE id = $1',
      [req.user.id]
    );

    if (!rows[0]?.gemini_api_key) {
      return res.status(400).json({ error: 'Chave API não configurada.' });
    }

    const apiKey = decrypt(rows[0].gemini_api_key);
    const prompt = buildQuotePrompt(projectData);
    const content = await callAIProvider(aiProvider, apiKey, prompt);

    if (!content) {
      throw new Error('Sem resposta da IA.');
    }

    const quote = extractJSON(content);

    // Save quote
    const { rows: saved } = await pool.query(
      `INSERT INTO quotes (
        user_id, client_value, client_size, complexity, urgency,
        integration_needs, security_level, team_seniority, support_level,
        duration, team_size, desired_margin, annual_revenue,
        process_to_optimize, time_spent, people_involved, estimated_loss,
        tools, implementation_fee, recurring_fee, reasoning
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      RETURNING id`,
      [
        req.user.id, projectData.clientValue, projectData.clientSize,
        projectData.complexity, projectData.urgency, projectData.integrationNeeds,
        projectData.securityLevel, projectData.teamSeniority, projectData.supportLevel,
        projectData.duration, projectData.teamSize, projectData.desiredMargin,
        projectData.annualRevenue, projectData.processToOptimize,
        projectData.timeSpent, projectData.peopleInvolved, projectData.estimatedLoss,
        JSON.stringify(projectData.tools || []),
        quote.implementationFee, quote.recurringFee, quote.reasoning,
      ]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, 'generate_quote', 'quote', saved[0].id, JSON.stringify({ aiProvider }), req.ip, req.get('user-agent')]
    );

    res.json({ ...quote, quoteId: saved[0].id });
  } catch (err) {
    console.error('Generate quote error:', err);

    if (err.message === 'RATE_LIMIT') {
      return res.status(429).json({ error: 'Limite de requisições do provider atingido. Tente novamente.' });
    }
    if (err.message === 'INVALID_KEY') {
      return res.status(401).json({ error: 'Chave API inválida. Verifique nas configurações.' });
    }

    res.status(500).json({ error: err.message || 'Erro ao gerar orçamento.' });
  }
});

// List user quotes
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT q.id, q.client_value, q.client_size, q.complexity,
              q.implementation_fee, q.recurring_fee, q.created_at,
              COALESCE(
                (SELECT json_agg(json_build_object('recommendation', co.recommendation, 'created_at', co.created_at))
                 FROM counter_offers co WHERE co.quote_id = q.id), '[]'
              ) as counter_offers,
              (SELECT COUNT(*) FROM chat_messages cm WHERE cm.quote_id = q.id)::int as chat_message_count
       FROM quotes q
       WHERE q.user_id = $1
       ORDER BY q.created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error('List quotes error:', err);
    res.status(500).json({ error: 'Erro ao buscar orçamentos.' });
  }
});

// Counter offer analysis
router.post('/:quoteId/counter-offer', async (req, res) => {
  try {
    const { quoteId } = req.params;
    const { originalQuote, counterOffer, projectData } = req.body;

    // Get user's API key
    const { rows } = await pool.query(
      'SELECT gemini_api_key FROM profiles WHERE id = $1',
      [req.user.id]
    );

    if (!rows[0]?.gemini_api_key) {
      return res.status(400).json({ error: 'Chave API não configurada.' });
    }

    const apiKey = decrypt(rows[0].gemini_api_key);
    const aiProvider = req.body.aiProvider || localStorage?.getItem?.('ai_provider') || 'gemini';
    const prompt = buildCounterOfferPrompt(originalQuote, counterOffer, projectData);
    const content = await callAIProvider(aiProvider, apiKey, prompt);
    const analysis = extractJSON(content);

    // Save counter offer
    await pool.query(
      `INSERT INTO counter_offers (quote_id, client_implementation, client_recurring, recommendation, analysis, suggested_response, new_implementation_fee, new_recurring_fee)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        quoteId, counterOffer.implementation, counterOffer.recurring,
        analysis.recommendation, analysis.analysis, analysis.suggestedResponse,
        analysis.newOffer?.implementationFee || null, analysis.newOffer?.recurringFee || null,
      ]
    );

    res.json(analysis);
  } catch (err) {
    console.error('Counter offer error:', err);

    if (err.message === 'RATE_LIMIT') {
      return res.status(429).json({ error: 'Limite de requisições atingido.' });
    }
    if (err.message === 'INVALID_KEY') {
      return res.status(401).json({ error: 'Chave API inválida.' });
    }

    res.status(500).json({ error: err.message || 'Erro ao analisar contraproposta.' });
  }
});

export default router;
