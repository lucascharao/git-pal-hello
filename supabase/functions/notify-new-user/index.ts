import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewUserData {
  fullName: string;
  email: string;
  whatsapp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullName, email, whatsapp }: NewUserData = await req.json();

    console.log('Sending notification for new user:', { fullName, email, whatsapp });

    const emailResponse = await resend.emails.send({
      from: "IA Budget Generator <onboarding@resend.dev>",
      to: ["lukascharao17@gmail.com"],
      subject: `🎉 Novo Cadastro - ${fullName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .content {
                background: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .info-card {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 15px 0;
                border-left: 4px solid #667eea;
              }
              .info-row {
                margin: 12px 0;
              }
              .label {
                font-weight: 600;
                color: #667eea;
                display: inline-block;
                min-width: 100px;
              }
              .value {
                color: #333;
              }
              .footer {
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
              }
              .whatsapp-link {
                display: inline-block;
                background: #25D366;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                text-decoration: none;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 Novo Usuário Cadastrado!</h1>
            </div>
            <div class="content">
              <p>Um novo usuário se cadastrou no <strong>IA Budget Generator</strong>:</p>
              
              <div class="info-card">
                <div class="info-row">
                  <span class="label">👤 Nome:</span>
                  <span class="value">${fullName}</span>
                </div>
                <div class="info-row">
                  <span class="label">📧 Email:</span>
                  <span class="value"><a href="mailto:${email}">${email}</a></span>
                </div>
                <div class="info-row">
                  <span class="label">📱 WhatsApp:</span>
                  <span class="value">${whatsapp}</span>
                </div>
              </div>

              <p style="text-align: center;">
                <a href="https://wa.me/${whatsapp.replace(/\D/g, '')}" class="whatsapp-link" target="_blank">
                  💬 Enviar mensagem no WhatsApp
                </a>
              </p>
              
              <div class="footer">
                <p>Data do cadastro: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
                <p>IA Budget Generator - Sistema de Orçamentos com Chris Voss AI</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending notification email:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
