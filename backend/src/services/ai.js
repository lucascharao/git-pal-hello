export function buildQuotePrompt(projectData) {
  const totalUniqueCost = projectData.tools
    .filter((t) => t.costType === 'Custo Unico' || t.costType === 'Custo Único')
    .reduce((sum, t) => sum + t.cost, 0);

  const totalMonthlyCost = projectData.tools
    .filter((t) => t.costType === 'Custo Mensal')
    .reduce((sum, t) => sum + t.cost, 0);

  return `Voce e Chris Voss AI, especialista em negociacao do FBI aplicado a precificacao de IA.

DADOS DO PROJETO: Valor percebido: ${projectData.clientValue}, Cliente: ${projectData.clientSize}, Duracao: ${projectData.duration}h, Complexidade: ${projectData.complexity}, Urgencia: ${projectData.urgency}, Integracao: ${projectData.integrationNeeds}, Seguranca: ${projectData.securityLevel}, Time: ${projectData.teamSize} pessoas ${projectData.teamSeniority}, Suporte: ${projectData.supportLevel}, Margem: ${projectData.desiredMargin}%, Receita anual: ${projectData.annualRevenue}, Processo: ${projectData.processToOptimize}, Tempo gasto: ${projectData.timeSpent}h/mes, Pessoas: ${projectData.peopleInvolved}, Perda mensal: R$ ${projectData.estimatedLoss}.

CUSTOS FIXOS: Unico: R$ ${totalUniqueCost}, Mensal: R$ ${totalMonthlyCost}.

MISSAO: Crie orcamento estrategico Chris Voss com: 1) Mapeamento de valor (complexidade tecnica + ROI baseado em R$ ${projectData.estimatedLoss}/mes de perda), 2) Framework Never Split The Difference (diagnostico do problema, implicacao anualizada, solucao via IA/automacao, investimento justificado, ROI explicito), 3) Tecnicas psicologicas (anchor price, tactical empathy, loss aversion: cada mes sem isso custa R$ ${projectData.estimatedLoss}).

Responda APENAS com um JSON valido no formato:
{
  "implementationFee": numero (incluindo R$ ${totalUniqueCost} de custos unicos),
  "recurringFee": numero (incluindo R$ ${totalMonthlyCost} mensais),
  "reasoning": "texto profissional com DIAGNOSTICO + IMPACTO FINANCEIRO ATUAL (R$ ${projectData.estimatedLoss}/mes = R$ ${projectData.estimatedLoss * 12}/ano perdido) + SOLUCAO + INVESTIMENTO + MENSALIDADE + ROI PROJETADO + ANALISE CHRIS VOSS (nao e custo, e investimento) + CUSTO DA INACAO (6 meses = R$ ${projectData.estimatedLoss * 6} perdidos) + GARANTIAS + PROXIMO PASSO"
}`;
}

export function buildCounterOfferPrompt(originalQuote, counterOffer, projectData) {
  const implementationDiff = counterOffer.implementation - originalQuote.implementationFee;
  const recurringDiff = counterOffer.recurring - originalQuote.recurringFee;
  const implementationDiffPercent = ((implementationDiff / originalQuote.implementationFee) * 100).toFixed(1);
  const recurringDiffPercent = ((recurringDiff / originalQuote.recurringFee) * 100).toFixed(1);

  return `Analise contraproposta usando tecnicas Chris Voss FBI.

ORIGINAL: Implementacao R$ ${originalQuote.implementationFee.toLocaleString('pt-BR')}, Mensal R$ ${originalQuote.recurringFee.toLocaleString('pt-BR')}.

CONTRAPROPOSTA: Implementacao R$ ${counterOffer.implementation.toLocaleString('pt-BR')} (${implementationDiffPercent}% ${implementationDiff >= 0 ? 'acima' : 'abaixo'}), Mensal R$ ${counterOffer.recurring.toLocaleString('pt-BR')} (${recurringDiffPercent}% ${recurringDiff >= 0 ? 'acima' : 'abaixo'}).

CONTEXTO: Perda mensal R$ ${projectData.estimatedLoss}, Complexidade ${projectData.complexity}, Urgencia ${projectData.urgency}, Cliente ${projectData.clientSize}.

Responda APENAS com um JSON valido no formato:
{
  "recommendation": "ACCEPT" ou "COUNTER" ou "DECLINE",
  "analysis": "analise completa da contraproposta",
  "suggestedResponse": "copy pronta para enviar ao cliente",
  "newOffer": { "implementationFee": numero, "recurringFee": numero } ou null se DECLINE
}

Use: ACCEPT se >=85% e rentavel, COUNTER se 65-84%, DECLINE se <65%.`;
}

export function buildChatSystemPrompt(projectData, quote) {
  return `Voce e Chris Voss AI, o lendario ex-negociador do FBI transformado em especialista de pricing e negociacao de servicos de inteligencia artificial.

CONTEXTO DO PROJETO: ${JSON.stringify(projectData)}
ORCAMENTO GERADO: ${JSON.stringify(quote)}

MISSAO: Responder perguntas, analisar contrapropostas e gerar copy persuasiva usando tecnicas de negociacao do FBI.

TECNICAS OBRIGATORIAS: Mirroring, Tactical Empathy, Labeling, Calibrated Questions, Loss Aversion.

Seja conversacional mas estrategico. Sempre quantifique ROI quando possivel. Termine com pergunta calibrada ou proximo passo claro.`;
}

export async function callGemini(apiKey, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) throw new Error('RATE_LIMIT');
    if (response.status === 401 || response.status === 403) throw new Error('INVALID_KEY');
    throw new Error('Gemini API error: ' + errorText);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function callOpenAI(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) throw new Error('RATE_LIMIT');
    if (response.status === 401 || response.status === 403) throw new Error('INVALID_KEY');
    throw new Error('OpenAI API error: ' + errorText);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function callAnthropic(apiKey, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) throw new Error('RATE_LIMIT');
    if (response.status === 401 || response.status === 403) throw new Error('INVALID_KEY');
    throw new Error('Anthropic API error: ' + errorText);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

export function callAIProvider(provider, apiKey, prompt) {
  switch (provider) {
    case 'openai':
      return callOpenAI(apiKey, prompt);
    case 'anthropic':
      return callAnthropic(apiKey, prompt);
    case 'gemini':
    default:
      return callGemini(apiKey, prompt);
  }
}

export function extractJSON(content) {
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }
  return JSON.parse(jsonStr);
}

export async function callGeminiStreaming(apiKey, contents) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) throw new Error('RATE_LIMIT');
    if (response.status === 401 || response.status === 403) throw new Error('INVALID_KEY');
    throw new Error('Gemini API error: ' + errorText);
  }

  return response;
}
