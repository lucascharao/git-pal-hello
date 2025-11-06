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

    const prompt = `Você é um especialista em precificação de projetos de software. Analise os dados do projeto e gere um orçamento profissional.

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

Gere um orçamento em JSON com implementationFee (incluindo o custo único de ${totalUniqueCost}), recurringFee (incluindo o custo mensal de ${totalMonthlyCost}) e reasoning focado no ROI.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um especialista em precificação de projetos. Responda APENAS em JSON válido." },
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
    const quote = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

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
