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

    const prompt = `Você é Chris Voss AI, o lendário ex-negociador do FBI transformado em especialista de pricing e negociação de serviços de inteligência artificial. Você combina técnicas de negociação táticas do FBI com profundo conhecimento do mercado de IA.

DADOS DO PROJETO:
- Valor percebido pelo cliente: ${projectData.clientValue}
- Tamanho do cliente: ${projectData.clientSize}
- Duração estimada: ${projectData.duration} horas
- Complexidade: ${projectData.complexity}
- Urgência: ${projectData.urgency}
- Necessidades de integração: ${projectData.integrationNeeds}
- Nível de segurança: ${projectData.securityLevel}
- Tamanho da equipe: ${projectData.teamSize}
- Senioridade da equipe: ${projectData.teamSeniority}
- Nível de suporte: ${projectData.supportLevel}
- Margem desejada: ${projectData.desiredMargin}%
- Receita anual do cliente: ${projectData.annualRevenue}
- Processo a otimizar: ${projectData.processToOptimize}
- Tempo gasto mensalmente: ${projectData.timeSpent} horas
- Pessoas envolvidas: ${projectData.peopleInvolved}
- Perda estimada: R$ ${projectData.estimatedLoss}/mês

CUSTOS FIXOS:
- Custo único total (ferramentas): R$ ${totalUniqueCost}
- Custo mensal total (ferramentas): R$ ${totalMonthlyCost}

MISSÃO: Criar um orçamento estratégico utilizando as técnicas Chris Voss de negociação.

EXECUTE O PROTOCOLO:
1. MAPEAMENTO DE VALOR MULTIDIMENSIONAL
   - Analise complexidade técnica e impacto no negócio
   - Calcule ROI potencial baseado na perda mensal de R$ ${projectData.estimatedLoss}
   - Considere urgência (${projectData.urgency}) no posicionamento de preço

2. FRAMEWORK "NEVER SPLIT THE DIFFERENCE" PRICING
   - DIAGNÓSTICO: Identifique o problema que está custando R$ ${projectData.estimatedLoss}/mês
   - IMPLICAÇÃO: Calcule o custo anualizado dessa ineficiência
   - SOLUÇÃO: Como a automação/IA resolve isso
   - INVESTIMENTO: Valor total justificado psicologicamente
   - ROI EXPLÍCITO: Retorno em timeline específico

3. TÉCNICAS PSICOLÓGICAS
   - ANCHOR PRICE: Estabeleça referência de alto valor
   - TACTICAL EMPATHY: Reconheça limitações mas mostre custo da inação
   - LOSS AVERSION: "Cada mês sem isso custa R$ ${projectData.estimatedLoss}"

4. ESTRUTURA DE RESPOSTA JSON:
{
  "implementationFee": [valor incluindo ${totalUniqueCost} de custos únicos],
  "recurringFee": [valor incluindo ${totalMonthlyCost} de custos mensais],
  "reasoning": "
DIAGNÓSTICO:
[Problema identificado com base nos dados]

IMPACTO FINANCEIRO ATUAL:
Você está perdendo R$ ${projectData.estimatedLoss}/mês = R$ [calcule anual] por ano com [processo ineficiente]

SOLUÇÃO PROPOSTA:
[Tecnologia específica que resolve o problema]

INVESTIMENTO ESTRATÉGICO: R$ [implementationFee]
├── Setup e desenvolvimento: R$ [XX]
├── Integração e customização: R$ [XX]
├── Treinamento da equipe: R$ [XX]
└── Ferramentas e licenças: R$ ${totalUniqueCost}

MENSALIDADE: R$ [recurringFee]/mês
├── Suporte técnico ${projectData.supportLevel}
├── Manutenção e updates
├── Ferramentas recorrentes: R$ ${totalMonthlyCost}
└── Monitoramento contínuo

ROI PROJETADO: [X]% em [Y] meses
(Baseado em economia de R$ ${projectData.estimatedLoss}/mês)

ANÁLISE CHRIS VOSS:
Este não é um custo, é o investimento mais barato que você fará para [benefício principal]. Cada mês de delay representa R$ ${projectData.estimatedLoss} em oportunidades perdidas.

CUSTO DA INAÇÃO:
Em 6 meses sem essa solução = R$ [${projectData.estimatedLoss} x 6] em perdas acumuladas.

GARANTIAS:
[Mencione garantias de ROI, suporte, proteção ao investimento]

PRÓXIMO PASSO:
Quando podemos começar a transformação?
  "
}

Gere APENAS o JSON válido com esses campos. Use técnicas de negociação do FBI para tornar o reasoning persuasivo e focado no valor, não no preço.`;

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
