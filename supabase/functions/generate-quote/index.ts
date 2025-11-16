import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, RateLimitError, getRateLimitHeaders } from '../_shared/rateLimiter.ts';
import { addSecurityHeaders } from '../_shared/securityHeaders.ts';
import { logAudit } from '../_shared/auditLogger.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { getCorsHeaders, getPreflightHeaders } from '../_shared/corsHelpers.ts';

serve(async (req) => {
  const corsHeaders = addSecurityHeaders(getCorsHeaders(req));
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: addSecurityHeaders(getPreflightHeaders(req)) });
  }

  try {
    // Rate limiting por IP
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    await checkRateLimit(`generate-quote:${clientIP}`, { maxRequests: 5, windowMs: 60000 });

    const { projectData } = await req.json();
    
    // Audit log
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      await logAudit(supabase, {
        action: 'generate_quote',
        resourceType: 'quote',
        metadata: { projectData },
        ipAddress: clientIP,
        userAgent: req.headers.get('user-agent') || undefined,
      });
    }
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
    
    if (error instanceof RateLimitError) {
      const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
      const rateLimitHeaders = getRateLimitHeaders(`generate-quote:${clientIP}`, { maxRequests: 5, windowMs: 60000 });
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' }, 
          status: 429 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
