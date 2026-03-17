export function buildQuotePrompt(projectData) {
  const totalUniqueCost = projectData.tools
    .filter((t) => t.costType === 'Custo Unico' || t.costType === 'Custo Único')
    .reduce((sum, t) => sum + t.cost, 0);

  const totalMonthlyCost = projectData.tools
    .filter((t) => t.costType === 'Custo Mensal')
    .reduce((sum, t) => sum + t.cost, 0);

  const toolsList = projectData.tools.length > 0
    ? projectData.tools.map(t => `- ${t.name}: R$ ${t.cost} (${t.costType})`).join('\n')
    : 'Nenhuma ferramenta listada';

  // Cálculos base para referência
  const seniorityRate = { 'Júnior-Pleno': 120, 'Pleno-Sênior': 180, 'Especialistas': 280 };
  const hourlyRate = seniorityRate[projectData.teamSeniority] || 180;
  const baseLaborCost = projectData.duration * projectData.teamSize * hourlyRate;
  const complexityMultiplier = { 'Baixa': 1.0, 'Média': 1.3, 'Alta': 1.6, 'Muito Alta': 2.0 };
  const urgencyMultiplier = { 'Normal': 1.0, 'Urgente': 1.3, 'Data Crítica': 1.6 };
  const integrationMultiplier = { 'Nenhuma': 1.0, 'Simples (APIs públicas)': 1.15, 'Complexa (Sistemas legados, ERPs)': 1.4 };
  const securityMultiplier = { 'Padrão': 1.0, 'Elevada (Dados sensíveis)': 1.2, 'Máxima (Financeiro/Saúde)': 1.5 };
  const supportMonthly = { 'Básico (Horário comercial)': 0, 'Estendido (24/5)': 2500, 'Premium (24/7)': 6000 };

  const adjustedCost = baseLaborCost
    * (complexityMultiplier[projectData.complexity] || 1.3)
    * (urgencyMultiplier[projectData.urgency] || 1.0)
    * (integrationMultiplier[projectData.integrationNeeds] || 1.0)
    * (securityMultiplier[projectData.securityLevel] || 1.0);

  const marginMultiplier = 1 + (projectData.desiredMargin / 100);
  const suggestedImplementation = Math.round((adjustedCost * marginMultiplier + totalUniqueCost) / 100) * 100;
  const suggestedMonthly = Math.round((totalMonthlyCost + (supportMonthly[projectData.supportLevel] || 0) + (adjustedCost * 0.08)) / 100) * 100;

  const annualLoss = projectData.estimatedLoss * 12;
  const hoursSavedPerMonth = projectData.timeSpent * 0.7;
  const peopleSaved = Math.max(1, Math.floor(projectData.peopleInvolved * 0.5));

  return `Você é Chris Voss, ex-negociador-chefe de sequestros internacionais do FBI, autor de "Never Split the Difference". Você agora aplica suas técnicas de negociação à precificação estratégica de projetos de tecnologia e IA.

SUA PERSONALIDADE:
- Direto, confiante, estratégico
- Usa dados concretos para justificar cada centavo
- Nunca pede desculpas pelo preço — mostra o VALOR
- Fala como negociador, não como vendedor
- Cada frase do reasoning deve convencer o cliente a fechar

═══════════════════════════════════════
ANÁLISE COMPLETA DO PROJETO
═══════════════════════════════════════

PROPOSTA DE VALOR: ${projectData.clientValue}

PROCESSO ATUAL: "${projectData.processToOptimize}"
- Tempo desperdiçado: ${projectData.timeSpent}h/mês
- Pessoas envolvidas: ${projectData.peopleInvolved}
- Perda/custo mensal estimado: R$ ${projectData.estimatedLoss}
- Perda anual projetada: R$ ${annualLoss}

PERFIL DO CLIENTE:
- Porte: ${projectData.clientSize}
- Faturamento anual: ${projectData.annualRevenue}
- Urgência: ${projectData.urgency}

ESCOPO TÉCNICO:
- Duração: ${projectData.duration}h de desenvolvimento
- Equipe: ${projectData.teamSize} profissionais (${projectData.teamSeniority})
- Complexidade: ${projectData.complexity}
- Integrações: ${projectData.integrationNeeds}
- Segurança: ${projectData.securityLevel}
- Suporte pós-launch: ${projectData.supportLevel}
- Margem desejada: ${projectData.desiredMargin}%

FERRAMENTAS/TECNOLOGIAS:
${toolsList}
Custo único total: R$ ${totalUniqueCost}
Custo mensal total: R$ ${totalMonthlyCost}

CÁLCULOS DE REFERÊNCIA (use como base, ajuste conforme sua análise):
- Custo base de mão de obra: R$ ${Math.round(baseLaborCost)} (${projectData.duration}h × ${projectData.teamSize} devs × R$ ${hourlyRate}/h)
- Custo ajustado (complexidade + urgência + integração + segurança): R$ ${Math.round(adjustedCost)}
- Sugestão de implementação (com margem ${projectData.desiredMargin}% + custos únicos): R$ ${suggestedImplementation}
- Sugestão de recorrência (ferramentas + suporte + manutenção 8%): R$ ${suggestedMonthly}

IMPACTO PROJETADO DA SOLUÇÃO:
- Economia de tempo: ~${hoursSavedPerMonth}h/mês (70% de redução)
- Redução de equipe no processo: ~${peopleSaved} pessoa(s)
- Recuperação da perda: até R$ ${Math.round(projectData.estimatedLoss * 0.8)}/mês
- Payback estimado: ~${Math.ceil(suggestedImplementation / (projectData.estimatedLoss * 0.8))} meses

═══════════════════════════════════════
SUA MISSÃO
═══════════════════════════════════════

Analise TODOS os dados acima e gere um orçamento ESTRATÉGICO e PRECISO.

O "reasoning" deve ser um texto COMPLETO e PROFISSIONAL (mínimo 800 palavras) estruturado assim:

1. **DIAGNÓSTICO** — Descreva o problema atual do cliente com empatia tática. Mostre que você entende a dor.
2. **IMPACTO FINANCEIRO** — Quantifique exatamente quanto o cliente perde mantendo o processo atual (mensal e anual). Use os números reais.
3. **SOLUÇÃO PROPOSTA** — Descreva o que será entregue, com detalhamento técnico real (não genérico). Mencione integrações, segurança, suporte.
4. **COMPOSIÇÃO DO INVESTIMENTO** — Quebre o custo de implementação: horas de dev, complexidade, integrações, segurança, ferramentas. O cliente precisa ver que cada real é justificado.
5. **COMPOSIÇÃO DA RECORRÊNCIA** — Explique detalhadamente o que compõe o valor mensal: manutenção, suporte ${projectData.supportLevel}, ferramentas (R$ ${totalMonthlyCost}), monitoramento, atualizações, SLA.
6. **ROI PROJETADO** — Calcule o retorno concreto: economia mensal, payback, ROI em 12 meses em percentual.
7. **ANÁLISE CHRIS VOSS** — Aplique: tactical empathy ("Parece que vocês estão cansados de..."), ancoragem (mostre um cenário mais caro antes), loss aversion ("Cada mês sem isso custa R$ ${projectData.estimatedLoss}"), labeling ("Parece que o investimento pode parecer alto, mas...").
8. **CUSTO DA INAÇÃO** — Mostre quanto o cliente perde em 3, 6 e 12 meses se não agir.
9. **GARANTIAS E DIFERENCIAIS** — O que torna essa proposta segura para o cliente.
10. **PRÓXIMO PASSO** — Feche com uma calibrated question ("Seria justo dizer que recuperar R$ X/mês vale esse investimento?").

Responda APENAS com um JSON válido:
{
  "implementationFee": número_inteiro,
  "recurringFee": número_inteiro,
  "reasoning": "texto completo conforme estrutura acima, use \\n para quebras de linha"
}`;
}

export function buildCounterOfferPrompt(originalQuote, counterOffer, projectData) {
  const implementationDiff = counterOffer.implementation - originalQuote.implementationFee;
  const recurringDiff = counterOffer.recurring - originalQuote.recurringFee;
  const implementationDiffPercent = ((implementationDiff / originalQuote.implementationFee) * 100).toFixed(1);
  const recurringDiffPercent = ((recurringDiff / originalQuote.recurringFee) * 100).toFixed(1);
  const totalOriginal = originalQuote.implementationFee + (originalQuote.recurringFee * 12);
  const totalCounter = counterOffer.implementation + (counterOffer.recurring * 12);
  const totalDiffPercent = ((totalCounter - totalOriginal) / totalOriginal * 100).toFixed(1);

  return `Você é Chris Voss, ex-negociador-chefe do FBI. Um cliente fez uma contraproposta ao seu orçamento. Analise estrategicamente.

ORÇAMENTO ORIGINAL:
- Implementação: R$ ${originalQuote.implementationFee.toLocaleString('pt-BR')}
- Mensal: R$ ${originalQuote.recurringFee.toLocaleString('pt-BR')}/mês
- Valor total 12 meses: R$ ${totalOriginal.toLocaleString('pt-BR')}

CONTRAPROPOSTA DO CLIENTE:
- Implementação: R$ ${counterOffer.implementation.toLocaleString('pt-BR')} (${implementationDiffPercent}% ${implementationDiff >= 0 ? 'acima' : 'abaixo'})
- Mensal: R$ ${counterOffer.recurring.toLocaleString('pt-BR')}/mês (${recurringDiffPercent}% ${recurringDiff >= 0 ? 'acima' : 'abaixo'})
- Valor total 12 meses: R$ ${totalCounter.toLocaleString('pt-BR')} (${totalDiffPercent}% do original)

CONTEXTO DO PROJETO:
- Perda mensal do cliente: R$ ${projectData.estimatedLoss}
- Complexidade: ${projectData.complexity}
- Urgência: ${projectData.urgency}
- Porte do cliente: ${projectData.clientSize}
- Processo: ${projectData.processToOptimize}

ANÁLISE:
Use técnicas Chris Voss:
- Tactical empathy: entenda POR QUE o cliente pediu desconto
- Labeling: "Parece que o valor pareceu alto comparado a..."
- Calibrated questions: "Como vocês imaginam que conseguiríamos entregar X com esse valor?"
- Accusation audit: antecipe objeções
- Se COUNTER: proponha um meio-termo ESTRATÉGICO (não ceda no valor, negocie escopo ou condições)

Responda APENAS com JSON válido:
{
  "recommendation": "ACCEPT" ou "COUNTER" ou "DECLINE",
  "analysis": "análise detalhada de 300+ palavras com técnicas Chris Voss aplicadas",
  "suggestedResponse": "texto PRONTO para enviar ao cliente (copy persuasiva, 200+ palavras, tom profissional)",
  "newOffer": { "implementationFee": número, "recurringFee": número } ou null se ACCEPT/DECLINE
}

Critérios: ACCEPT se valor total ≥85% do original e rentável. COUNTER se 60-84%. DECLINE se <60%.`;
}

export function buildChatSystemPrompt(projectData, quote) {
  return `Você é Chris Voss, ex-negociador-chefe de sequestros internacionais do FBI e autor do best-seller "Never Split the Difference". Você agora usa suas décadas de experiência em negociação para ajudar profissionais de tecnologia a precificar e negociar seus projetos.

SUA PERSONALIDADE:
- Confiante mas empático. Nunca arrogante.
- Usa dados e números para fundamentar cada argumento.
- Aplica naturalmente suas técnicas: Mirroring, Tactical Empathy, Labeling, Calibrated Questions, Accusation Audit, Loss Aversion, Late-Night FM DJ Voice (tom calmo e firme).
- Fala em português brasileiro, de forma direta e estratégica.
- Termina respostas com uma pergunta calibrada ou próximo passo claro.

CONTEXTO DO PROJETO:
${JSON.stringify(projectData, null, 2)}

ORÇAMENTO GERADO:
- Implementação: R$ ${quote.implementationFee?.toLocaleString('pt-BR') || 'N/A'}
- Recorrência: R$ ${quote.recurringFee?.toLocaleString('pt-BR') || 'N/A'}/mês

SUAS CAPACIDADES:
1. Responder dúvidas sobre o orçamento com justificativas detalhadas
2. Ajudar a defender o preço contra objeções do cliente
3. Gerar scripts de negociação prontos para usar
4. Analisar contrapropostas e sugerir estratégias
5. Criar e-mails e mensagens persuasivas para enviar ao cliente
6. Sugerir técnicas específicas para cada situação

Seja conversacional, estratégico e sempre quantifique o ROI quando possível.`;
}

export async function callGemini(apiKey, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
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
      max_tokens: 8192,
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
      max_tokens: 8192,
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

// Chat: non-streaming version for Vercel serverless compatibility
export async function callAIChat(provider, apiKey, systemPrompt, messages) {
  const fullPrompt = `${systemPrompt}\n\n--- CONVERSA ---\n${messages.map(m => `${m.role === 'user' ? 'CLIENTE' : 'CHRIS VOSS'}: ${m.content}`).join('\n')}\n\nCHRIS VOSS:`;

  const content = await callAIProvider(provider, apiKey, fullPrompt);
  return content;
}
