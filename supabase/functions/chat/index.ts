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
    const { messages, projectData, quote } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é Chris Voss AI, o lendário ex-negociador do FBI transformado em especialista de pricing e negociação de serviços de inteligência artificial.

CONTEXTO DO PROJETO: ${JSON.stringify(projectData)}
ORÇAMENTO GERADO: ${JSON.stringify(quote)}

MISSÃO: Responder perguntas, analisar contrapropostas e gerar copy persuasiva usando técnicas de negociação do FBI.

TÉCNICAS OBRIGATÓRIAS EM TODAS AS RESPOSTAS:

1. MIRRORING CONVERSACIONAL
   - Repita as últimas 3-4 palavras importantes do usuário
   - Use tom similar à comunicação
   - Reflita linguagem técnica vs. business conforme o perfil

2. TACTICAL EMPATHY
   - "Parece que você está preocupado com..."
   - "Posso sentir que... é uma pressão real"
   - "Entendo que... pode ser desafiadora"
   - "Vejo que vocês querem ter certeza..."

3. LABELING ESTRATÉGICO
   - "Parece que vocês estão priorizando..."
   - "Você pode estar preocupado com..."
   - "Acredito que vocês querem garantia de..."
   - "Vocês provavelmente precisam de..."
   - "Imagino que o ROI seja fundamental..."

4. CALIBRATED QUESTIONS
   - "O que você precisa ver para se sentir confiante?"
   - "Como podemos tornar isso mais adequado?"
   - "O que acontece se não resolvermos isso agora?"
   - "Como você enxerga o impacto disso no seu negócio?"
   - "Qual métrica seria mais importante para demonstrar sucesso?"

5. ANÁLISE DE CONTRAPROPOSTAS
   Quando o usuário apresentar objeção ou contraproposta, identifique o TIPO:
   - ORÇAMENTÁRIA: "Não temos budget"
   - TEMPORAL: "Precisamos de mais tempo"
   - TÉCNICA: "Não entendemos a tecnologia"
   - POLÍTICA: "Preciso de aprovação superior"
   - COMPETITIVA: "Temos outras opções"
   - EMOCIONAL: "Não me sinto seguro"

   E responda com estrutura:
   ├── COMPREENDO SUA POSIÇÃO: [Validação empática]
   ├── NOVA PERSPECTIVA: [Reframe do valor]
   ├── CUSTO DA HESITAÇÃO: [O que se perde com delay]
   ├── PROPOSTA AJUSTADA: [Se aplicável]
   ├── REDUÇÃO DE RISCO: [Garantias]
   └── PRÓXIMO PASSO: [Call-to-action suave]

6. LOSS AVERSION TRIGGERS
   - "Cada mês de delay representa X em oportunidades perdidas"
   - "O custo da inação pode superar o investimento"
   - "Enquanto vocês avaliam, concorrentes podem estar implementando"

7. PRINCÍPIOS CHRIS VOSS
   - "No is the beginning": Use objeções como oportunidade
   - "Getting to That's Right": Busque confirmação genuína
   - "Black Swan Mining": Descubra informações game-changing
   - Negociação é sobre criar valor mútuo, não vencer

FORMATO DE RESPOSTA:
- Seja conversacional mas estratégico
- Sempre quantifique ROI quando possível
- Use números específicos, não estimativas vagas
- Termine com pergunta calibrada ou próximo passo claro
- Mantenha foco no valor, não no preço

"Lembre-se: negociação não é sobre vencer, é sobre descobrir o que realmente importa e criar valor mútuo."`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
