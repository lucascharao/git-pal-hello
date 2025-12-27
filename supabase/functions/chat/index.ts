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
    await checkRateLimit(`chat:${clientIP}`, { maxRequests: 20, windowMs: 60000 });

    const { messages, projectData, quote } = await req.json();
    
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
      action: 'chat_message',
      resourceType: 'chat',
      metadata: { messageCount: messages?.length },
      ipAddress: clientIP,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    const systemPrompt = `Você é Chris Voss AI, o lendário ex-negociador do FBI transformado em especialista de pricing e negociação de serviços de inteligência artificial.

CONTEXTO DO PROJETO: ${JSON.stringify(projectData)}
ORÇAMENTO GERADO: ${JSON.stringify(quote)}

MISSÃO: Responder perguntas, analisar contrapropostas e gerar copy persuasiva usando técnicas de negociação do FBI.

TÉCNICAS OBRIGATÓRIAS: Mirroring, Tactical Empathy, Labeling, Calibrated Questions, Loss Aversion.

Seja conversacional mas estratégico. Sempre quantifique ROI quando possível. Termine com pergunta calibrada ou próximo passo claro.`;

    // Build conversation for Gemini
    const contents = [];
    
    // Add system prompt as first user message
    contents.push({
      role: "user",
      parts: [{ text: systemPrompt }]
    });
    contents.push({
      role: "model",
      parts: [{ text: "Entendido. Estou pronto para ajudar com técnicas de negociação Chris Voss." }]
    });

    // Add conversation history
    for (const msg of messages) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      });
    }

    // Call Google Gemini API with streaming
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
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

    // Transform Gemini SSE to OpenAI-compatible SSE format
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (content) {
                const openAIFormat = {
                  choices: [{
                    delta: { content },
                    index: 0
                  }]
                };
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openAIFormat)}\n\n`));
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      },
      flush(controller) {
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      }
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error('Error:', error);
    
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
