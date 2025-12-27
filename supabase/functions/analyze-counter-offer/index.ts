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
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GEMINI_API_KEY = profile.gemini_api_key;
    
    // Audit log
    await logAudit(supabase, {
      action: 'analyze_counter_offer',
      resourceType: 'counter_offer',
      metadata: { originalQuote, counterOffer },
      ipAddress: clientIP,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    const implementationDiff = counterOffer.implementation - originalQuote.implementationFee;
    const recurringDiff = counterOffer.recurring - originalQuote.recurringFee;
    const implementationDiffPercent = ((implementationDiff / originalQuote.implementationFee) * 100).toFixed(1);
    const recurringDiffPercent = ((recurringDiff / originalQuote.recurringFee) * 100).toFixed(1);

    const prompt = `Analise contraproposta usando técnicas Chris Voss FBI. 

ORIGINAL: Implementação R$ ${originalQuote.implementationFee.toLocaleString('pt-BR')}, Mensal R$ ${originalQuote.recurringFee.toLocaleString('pt-BR')}. 

CONTRAPROPOSTA: Implementação R$ ${counterOffer.implementation.toLocaleString('pt-BR')} (${implementationDiffPercent}% ${implementationDiff >= 0 ? 'acima' : 'abaixo'}), Mensal R$ ${counterOffer.recurring.toLocaleString('pt-BR')} (${recurringDiffPercent}% ${recurringDiff >= 0 ? 'acima' : 'abaixo'}). 

CONTEXTO: Perda mensal R$ ${projectData.estimatedLoss}, Complexidade ${projectData.complexity}, Urgência ${projectData.urgency}, Cliente ${projectData.clientSize}. 

Responda APENAS com um JSON válido no formato:
{
  "recommendation": "ACCEPT" ou "COUNTER" ou "DECLINE",
  "analysis": "análise completa da contraproposta",
  "suggestedResponse": "copy pronta para enviar ao cliente",
  "newOffer": { "implementationFee": número, "recurringFee": número } ou null se DECLINE
}

Use: ACCEPT se >=85% e rentável, COUNTER se 65-84%, DECLINE se <65%.`;

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
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(JSON.stringify({ error: "Invalid Gemini API key" }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error("Gemini API error");
    }

    const data = await response.json();
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

    const analysis = JSON.parse(jsonStr);

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
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred processing your request' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
});
