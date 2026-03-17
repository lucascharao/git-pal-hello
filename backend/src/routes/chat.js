import { Router } from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { buildChatSystemPrompt, callGeminiStreaming } from '../services/ai.js';
import { decrypt } from '../services/crypto.js';

const router = Router();

router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const { messages, projectData, quote, quoteId } = req.body;

    const { rows } = await pool.query(
      'SELECT gemini_api_key FROM profiles WHERE id = $1',
      [req.user.id]
    );

    if (!rows[0]?.gemini_api_key) {
      return res.status(400).json({ error: 'Chave API não configurada.' });
    }

    const apiKey = decrypt(rows[0].gemini_api_key);
    const systemPrompt = buildChatSystemPrompt(projectData, quote);

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Entendido. Estou pronto para ajudar com técnicas de negociação Chris Voss.' }] },
    ];

    for (const msg of messages) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    // Save user message
    const lastUserMsg = messages[messages.length - 1];
    if (quoteId && lastUserMsg?.role === 'user') {
      await pool.query(
        'INSERT INTO chat_messages (quote_id, role, content) VALUES ($1, $2, $3)',
        [quoteId, 'user', lastUserMsg.content]
      );
    }

    const geminiResponse = await callGeminiStreaming(apiKey, contents);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = geminiResponse.body.getReader();
    const decoder = new TextDecoder();
    let fullAssistantMessage = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (content) {
              fullAssistantMessage += content;
              const openAIFormat = { choices: [{ delta: { content }, index: 0 }] };
              res.write(`data: ${JSON.stringify(openAIFormat)}\n\n`);
            }
          } catch {
            // skip
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

    // Save assistant message
    if (quoteId && fullAssistantMessage) {
      await pool.query(
        'INSERT INTO chat_messages (quote_id, role, content) VALUES ($1, $2, $3)',
        [quoteId, 'assistant', fullAssistantMessage]
      );
    }
  } catch (err) {
    console.error('Chat error:', err);

    if (!res.headersSent) {
      if (err.message === 'RATE_LIMIT') {
        return res.status(429).json({ error: 'Limite de requisições atingido.' });
      }
      if (err.message === 'INVALID_KEY') {
        return res.status(401).json({ error: 'Chave API inválida.' });
      }
      res.status(500).json({ error: 'Erro no chat.' });
    }
  }
});

export default router;
