import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalQuote, counterOffer, projectData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const implementationDiff = counterOffer.implementation - originalQuote.implementationFee;
    const recurringDiff = counterOffer.recurring - originalQuote.recurringFee;
    const implementationDiffPercent = ((implementationDiff / originalQuote.implementationFee) * 100).toFixed(1);
    const recurringDiffPercent = ((recurringDiff / originalQuote.recurringFee) * 100).toFixed(1);

    const prompt = `Você é Chris Voss AI, especialista em negociação do FBI. Analise esta contraproposta e forneça estratégia de negociação.

ORÇAMENTO ORIGINAL:
- Implementação: R$ ${originalQuote.implementationFee.toLocaleString('pt-BR')}
- Recorrência Mensal: R$ ${originalQuote.recurringFee.toLocaleString('pt-BR')}
- Justificativa: ${originalQuote.reasoning}

CONTRAPROPOSTA DO CLIENTE:
- Implementação proposta: R$ ${counterOffer.implementation.toLocaleString('pt-BR')} (${implementationDiffPercent}% ${implementationDiff >= 0 ? 'acima' : 'abaixo'})
- Recorrência proposta: R$ ${counterOffer.recurring.toLocaleString('pt-BR')} (${recurringDiffPercent}% ${recurringDiff >= 0 ? 'acima' : 'abaixo'})

CONTEXTO DO PROJETO:
- Perda mensal atual: R$ ${projectData.estimatedLoss}
- Complexidade: ${projectData.complexity}
- Urgência: ${projectData.urgency}
- Tamanho do cliente: ${projectData.clientSize}

PROTOCOLO DE ANÁLISE CHRIS VOSS:

1. IDENTIFICAÇÃO DO TIPO DE OBJEÇÃO
   Classifique: ORÇAMENTÁRIA | TEMPORAL | TÉCNICA | POLÍTICA | COMPETITIVA | EMOCIONAL

2. ANÁLISE COMPORTAMENTAL
   - O que a contraproposta revela sobre motivações reais?
   - Há indicadores de "Black Swan" (informações ocultas)?
   - Cliente está testando limites ou tem restrição real?

3. RECOMENDAÇÃO ESTRATÉGICA
   Baseado nos diferenciais percentuais, recomende:
   - ACCEPT: Se a proposta for >= 85% do valor original e ainda rentável
   - COUNTER: Se houver espaço para negociação (entre 65-84% do valor)
   - DECLINE: Se < 65% do valor ou inviável operacionalmente

4. ESTRUTURA DE RESPOSTA (JSON):
{
  "recommendation": "ACCEPT" | "COUNTER" | "DECLINE",
  "analysis": "
ANÁLISE DA CONTRAPROPOSTA

COMPREENDO SUA POSIÇÃO:
[Validação empática - mostre que entende a perspectiva do cliente]

ANÁLISE COMPORTAMENTAL:
[O que a contraproposta revela sobre o cliente - use insights do FBI]

IMPLICAÇÃO FINANCEIRA:
[Calcule o custo real da diferença vs. o custo da inação]

PERSPECTIVA ESTRATÉGICA:
[Reframe do valor usando técnicas Chris Voss]
  ",
  "suggestedResponse": "
[Copy pronta para envio ao cliente usando técnicas do FBI]

ESTRUTURA OBRIGATÓRIA:

Olá [Cliente],

[TACTICAL EMPATHY]
Entendo perfeitamente sua posição em relação ao investimento...

[MIRRORING + LABELING]
Percebo que [refraseie a preocupação principal do cliente]...

[CUSTO DA INAÇÃO]
Vamos analisar juntos: cada mês sem essa solução representa R$ ${projectData.estimatedLoss} em [problema]. Em 6 meses, isso totaliza R$ [calcule].

[PROPOSTA OU REAFIRMAÇÃO]
[Se COUNTER: apresente nova proposta]
[Se ACCEPT: confirme aceitação com valor agregado]
[Se DECLINE: explique por que não é viável mas ofereça alternativa]

[REDUÇÃO DE RISCO]
Para aumentar sua confiança, incluímos [garantias específicas]...

[CALIBRATED QUESTION]
Como você enxerga o impacto dessa solução no seu [processo/resultado específico]?

[NEXT STEP]
[Call-to-action claro e específico]

Estou à disposição para alinharmos os detalhes.

Atenciosamente,
[Seu Nome]
  ",
  "newOffer": {
    "implementationFee": [se COUNTER, propor valor ajustado; se ACCEPT, manter proposta cliente; se DECLINE, null],
    "recurringFee": [se COUNTER, propor valor ajustado; se ACCEPT, manter proposta cliente; se DECLINE, null]
  }
}

5. DIRETRIZES CHRIS VOSS:
   - Use "That's Right" moments: faça o cliente concordar genuinamente
   - Loss Aversion: enfatize o custo de não agir
   - Tactical Empathy: valide antes de contra-argumentar
   - Calibrated Questions: faça o cliente pensar nas consequências
   - Se COUNTER: ajuste entre 75-90% do valor original, justificado
   - Se DECLINE: sempre ofereça alternativa (faseamento, redução de escopo, etc)

Gere APENAS o JSON válido seguindo essa estrutura.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é Chris Voss AI, especialista em negociação do FBI. Responda APENAS em JSON válido." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-counter-offer:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
