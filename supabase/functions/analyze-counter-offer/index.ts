import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, RateLimitError } from '../_shared/rateLimiter.ts';
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
    await checkRateLimit(`analyze-counter:${clientIP}`, { maxRequests: 10, windowMs: 60000 });

    const { originalQuote, counterOffer, projectData } = await req.json();
    
    // Audit log
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      await logAudit(supabase, {
        action: 'analyze_counter_offer',
        resourceType: 'counter_offer',
        metadata: { originalQuote, counterOffer },
        ipAddress: clientIP,
        userAgent: req.headers.get('user-agent') || undefined,
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const implementationDiff = counterOffer.implementation - originalQuote.implementationFee;
    const recurringDiff = counterOffer.recurring - originalQuote.recurringFee;
    const implementationDiffPercent = ((implementationDiff / originalQuote.implementationFee) * 100).toFixed(1);
    const recurringDiffPercent = ((recurringDiff / originalQuote.recurringFee) * 100).toFixed(1);

    const prompt = `Analise contraproposta usando técnicas Chris Voss FBI. ORIGINAL: Implementação R$ ${originalQuote.implementationFee.toLocaleString('pt-BR')}, Mensal R$ ${originalQuote.recurringFee.toLocaleString('pt-BR')}. CONTRAPROPOSTA: Implementação R$ ${counterOffer.implementation.toLocaleString('pt-BR')} (${implementationDiffPercent}% ${implementationDiff >= 0 ? 'acima' : 'abaixo'}), Mensal R$ ${counterOffer.recurring.toLocaleString('pt-BR')} (${recurringDiffPercent}% ${recurringDiff >= 0 ? 'acima' : 'abaixo'}). CONTEXTO: Perda mensal R$ ${projectData.estimatedLoss}, Complexidade ${projectData.complexity}, Urgência ${projectData.urgency}, Cliente ${projectData.clientSize}. PROTOCOLO: 1) Identifique tipo de objeção (ORÇAMENTÁRIA/TEMPORAL/TÉCNICA/POLÍTICA/COMPETITIVA/EMOCIONAL), 2) Análise comportamental (motivações reais, Black Swans, teste de limites vs restrição real), 3) Recomendação (ACCEPT se >=85% e rentável, COUNTER se 65-84%, DECLINE se <65%), 4) Gere: recommendation, analysis (COMPREENDO SUA POSIÇÃO + ANÁLISE COMPORTAMENTAL + IMPLICAÇÃO FINANCEIRA + PERSPECTIVA ESTRATÉGICA), suggestedResponse (copy pronta: TACTICAL EMPATHY + MIRRORING/LABELING + CUSTO DA INAÇÃO [6 meses = R$ ${projectData.estimatedLoss * 6}] + PROPOSTA/REAFIRMAÇÃO + REDUÇÃO DE RISCO + CALIBRATED QUESTION + NEXT STEP), newOffer (se COUNTER: ajuste 75-90% original justificado, se ACCEPT: valores do cliente, se DECLINE: null com alternativa). Diretrizes: That's Right moments, Loss Aversion, Tactical Empathy primeiro, Calibrated Questions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é Chris Voss AI, especialista em negociação do FBI." },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_counter_offer",
              description: "Analisa contraproposta usando técnicas Chris Voss",
              parameters: {
                type: "object",
                properties: {
                  recommendation: {
                    type: "string",
                    enum: ["ACCEPT", "COUNTER", "DECLINE"],
                    description: "Recomendação estratégica"
                  },
                  analysis: {
                    type: "string",
                    description: "Análise completa da contraproposta"
                  },
                  suggestedResponse: {
                    type: "string",
                    description: "Copy pronta para enviar ao cliente"
                  },
                  newOffer: {
                    type: "object",
                    properties: {
                      implementationFee: { type: "number" },
                      recurringFee: { type: "number" }
                    },
                    description: "Nova proposta se COUNTER, ou proposta do cliente se ACCEPT"
                  }
                },
                required: ["recommendation", "analysis", "suggestedResponse"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_counter_offer" } }
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

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-counter-offer:', error);
    
    if (error instanceof RateLimitError) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
});
