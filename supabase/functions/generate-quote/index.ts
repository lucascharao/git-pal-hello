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
    
    // Get user's API key from profile
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's Gemini API key from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('gemini_api_key')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.gemini_api_key) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured. Please add your API key in settings.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GEMINI_API_KEY = profile.gemini_api_key;
    
    // Audit log
    await logAudit(supabase, {
      action: 'generate_quote',
      resourceType: 'quote',
      metadata: { projectData },
      ipAddress: clientIP,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    const totalUniqueCost = projectData.tools
      .filter((t: any) => t.costType === 'Custo Único')
      .reduce((sum: number, t: any) => sum + t.cost, 0);
    
    const totalMonthlyCost = projectData.tools
      .filter((t: any) => t.costType === 'Custo Mensal')
      .reduce((sum: number, t: any) => sum + t.cost, 0);

    const prompt = `Você é Chris Voss AI, especialista em negociação do FBI aplicado a precificação de IA.

DADOS DO PROJETO: Valor percebido: ${projectData.clientValue}, Cliente: ${projectData.clientSize}, Duração: ${projectData.duration}h, Complexidade: ${projectData.complexity}, Urgência: ${projectData.urgency}, Integração: ${projectData.integrationNeeds}, Segurança: ${projectData.securityLevel}, Time: ${projectData.teamSize} pessoas ${projectData.teamSeniority}, Suporte: ${projectData.supportLevel}, Margem: ${projectData.desiredMargin}%, Receita anual: ${projectData.annualRevenue}, Processo: ${projectData.processToOptimize}, Tempo gasto: ${projectData.timeSpent}h/mês, Pessoas: ${projectData.peopleInvolved}, Perda mensal: R$ ${projectData.estimatedLoss}.

CUSTOS FIXOS: Único: R$ ${totalUniqueCost}, Mensal: R$ ${totalMonthlyCost}.

MISSÃO: Crie orçamento estratégico Chris Voss com: 1) Mapeamento de valor (complexidade técnica + ROI baseado em R$ ${projectData.estimatedLoss}/mês de perda), 2) Framework Never Split The Difference (diagnóstico do problema, implicação anualizada, solução via IA/automação, investimento justificado, ROI explícito), 3) Técnicas psicológicas (anchor price, tactical empathy, loss aversion: cada mês sem isso custa R$ ${projectData.estimatedLoss}). 

Responda APENAS com um JSON válido no formato:
{
  "implementationFee": número (incluindo R$ ${totalUniqueCost} de custos únicos),
  "recurringFee": número (incluindo R$ ${totalMonthlyCost} mensais),
  "reasoning": "texto profissional com DIAGNÓSTICO + IMPACTO FINANCEIRO ATUAL (R$ ${projectData.estimatedLoss}/mês = R$ ${projectData.estimatedLoss * 12}/ano perdido) + SOLUÇÃO + INVESTIMENTO + MENSALIDADE + ROI PROJETADO + ANÁLISE CHRIS VOSS (não é custo, é investimento) + CUSTO DA INAÇÃO (6 meses = R$ ${projectData.estimatedLoss * 6} perdidos) + GARANTIAS + PRÓXIMO PASSO"
}`;

    // Call Google Gemini API directly
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded on Gemini API" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(JSON.stringify({ error: "Invalid Gemini API key. Please check your API key in settings." }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error("Gemini API error: " + errorText);
    }

    const data = await response.json();
    console.log('Gemini response:', JSON.stringify(data, null, 2));

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error("No content in Gemini response");
    }

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const quote = JSON.parse(jsonStr);

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
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred processing your request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
