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
    const { projectData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const totalUniqueCost = projectData.tools
      .filter((t: any) => t.costType === 'Custo Único')
      .reduce((sum: number, t: any) => sum + t.cost, 0);
    
    const totalMonthlyCost = projectData.tools
      .filter((t: any) => t.costType === 'Custo Mensal')
      .reduce((sum: number, t: any) => sum + t.cost, 0);

    const prompt = `Você é Chris Voss AI, especialista em negociação do FBI aplicado a precificação de IA.

DADOS DO PROJETO: Valor percebido: ${projectData.clientValue}, Cliente: ${projectData.clientSize}, Duração: ${projectData.duration}h, Complexidade: ${projectData.complexity}, Urgência: ${projectData.urgency}, Integração: ${projectData.integrationNeeds}, Segurança: ${projectData.securityLevel}, Time: ${projectData.teamSize} pessoas ${projectData.teamSeniority}, Suporte: ${projectData.supportLevel}, Margem: ${projectData.desiredMargin}%, Receita anual: ${projectData.annualRevenue}, Processo: ${projectData.processToOptimize}, Tempo gasto: ${projectData.timeSpent}h/mês, Pessoas: ${projectData.peopleInvolved}, Perda mensal: R$ ${projectData.estimatedLoss}.

CUSTOS FIXOS: Único: R$ ${totalUniqueCost}, Mensal: R$ ${totalMonthlyCost}.

MISSÃO: Crie orçamento estratégico Chris Voss com: 1) Mapeamento de valor (complexidade técnica + ROI baseado em R$ ${projectData.estimatedLoss}/mês de perda), 2) Framework Never Split The Difference (diagnóstico do problema, implicação anualizada, solução via IA/automação, investimento justificado, ROI explícito), 3) Técnicas psicológicas (anchor price, tactical empathy, loss aversion: cada mês sem isso custa R$ ${projectData.estimatedLoss}). Gere implementationFee (incluindo R$ ${totalUniqueCost} de custos únicos), recurringFee (incluindo R$ ${totalMonthlyCost} mensais) e reasoning profissional com DIAGNÓSTICO + IMPACTO FINANCEIRO ATUAL (R$ ${projectData.estimatedLoss}/mês = R$ ${projectData.estimatedLoss * 12}/ano perdido) + SOLUÇÃO + INVESTIMENTO + MENSALIDADE + ROI PROJETADO + ANÁLISE CHRIS VOSS (não é custo, é investimento) + CUSTO DA INAÇÃO (6 meses = R$ ${projectData.estimatedLoss * 6} perdidos) + GARANTIAS + PRÓXIMO PASSO.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é Chris Voss AI, especialista em negociação do FBI aplicada a precificação de IA." },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_quote",
              description: "Gera um orçamento estratégico usando técnicas Chris Voss",
              parameters: {
                type: "object",
                properties: {
                  implementationFee: {
                    type: "number",
                    description: "Valor total da implementação incluindo custos únicos"
                  },
                  recurringFee: {
                    type: "number",
                    description: "Valor mensal recorrente incluindo custos mensais"
                  },
                  reasoning: {
                    type: "string",
                    description: "Justificativa completa do orçamento seguindo framework Chris Voss"
                  }
                },
                required: ["implementationFee", "recurringFee", "reasoning"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_quote" } }
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
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall || !toolCall.function) {
      throw new Error("AI did not return structured output");
    }

    const quote = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(quote), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
