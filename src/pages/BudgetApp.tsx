import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { QuoteForm } from '@/components/QuoteForm';
import { ResultSection } from '@/components/ResultSection';
import { CounterOfferSection } from '@/components/CounterOfferSection';
import { CounterOfferAnalysis } from '@/components/CounterOfferAnalysis';
import GeminiApiKeyDialog from '@/components/GeminiApiKeyDialog';
import type { ProjectData, Quote, CounterOfferAnalysis as CounterOfferAnalysisType } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function BudgetApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [counterOfferAnalysis, setCounterOfferAnalysis] = useState<CounterOfferAnalysisType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      if (!user?.id) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('gemini_api_key')
        .eq('id', user.id)
        .maybeSingle();
      
      setHasApiKey(!!profile?.gemini_api_key);
    };
    
    checkApiKey();
  }, [user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleGenerateQuote = async (data: ProjectData) => {
    setIsLoading(true);
    setQuote(null);
    setProjectData(data);

    try {
      // Verify and refresh user session before making request
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      let accessToken = session?.access_token;
      const nowInSeconds = Math.floor(Date.now() / 1000);

      if (sessionError || !accessToken || (session?.expires_at && session.expires_at <= nowInSeconds + 30)) {
        const {
          data: refreshData,
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (refreshError || !refreshData.session?.access_token) {
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }

        accessToken = refreshData.session.access_token;
      }

      const { data: response, error } = await supabase.functions.invoke('generate-quote', {
        body: { projectData: data },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);

        let functionErrorMessage = '';
        const errorWithContext = error as { context?: Response };

        if (errorWithContext.context) {
          try {
            const payload = await errorWithContext.context.clone().json();
            functionErrorMessage = payload?.error || payload?.message || '';
          } catch {
            // Ignore parse error and fallback to generic error handling below
          }
        }

        if (functionErrorMessage) {
          throw new Error(functionErrorMessage);
        }

        throw error;
      }

      setQuote(response);

      // Salvar orçamento no banco de dados
      const { data: savedQuote, error: saveError } = await supabase
        .from('quotes')
        .insert([
          {
            user_id: user?.id,
            client_value: data.clientValue,
            client_size: data.clientSize,
            duration: data.duration,
            complexity: data.complexity,
            urgency: data.urgency,
            integration_needs: data.integrationNeeds,
            security_level: data.securityLevel,
            team_size: data.teamSize,
            team_seniority: data.teamSeniority,
            support_level: data.supportLevel,
            desired_margin: data.desiredMargin,
            annual_revenue: data.annualRevenue,
            process_to_optimize: data.processToOptimize,
            time_spent: data.timeSpent,
            people_involved: data.peopleInvolved,
            estimated_loss: data.estimatedLoss,
            tools: data.tools as any,
            implementation_fee: response.implementationFee,
            recurring_fee: response.recurringFee,
            reasoning: response.reasoning,
          },
        ])
        .select()
        .single();

      if (saveError) throw saveError;
      setQuoteId(savedQuote.id);

      toast({
        title: 'Orçamento gerado!',
        description: 'Seu orçamento foi criado com sucesso.',
      });
    } catch (error: any) {
      console.error('Erro ao gerar orçamento:', error);

      let errorMessage = 'Ocorreu um erro. Tente novamente.';

      if (
        error.message?.includes('Sessão expirada') ||
        error.message?.includes('Unauthorized') ||
        error.message?.includes('authorization header') ||
        error.message?.includes('JWT')
      ) {
        errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
        await supabase.auth.signOut();
        navigate('/login');
        return;
      } else if (error.message?.includes('Failed to send request')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message?.includes('Gemini API key')) {
        errorMessage = 'Sua chave da API Gemini está inválida ou ausente. Atualize a chave e tente novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: 'destructive',
        title: 'Erro ao gerar orçamento',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisComplete = async (
    analysis: CounterOfferAnalysisType,
    clientOffer: { implementation: number; recurring: number }
  ) => {
    setCounterOfferAnalysis(analysis);

    // Salvar contraproposta no banco
    if (quoteId) {
      try {
        await supabase.from('counter_offers').insert({
          quote_id: quoteId,
          client_implementation: clientOffer.implementation,
          client_recurring: clientOffer.recurring,
          recommendation: analysis.recommendation,
          analysis: analysis.analysis,
          suggested_response: analysis.suggestedResponse,
          new_implementation_fee: analysis.newOffer?.implementationFee,
          new_recurring_fee: analysis.newOffer?.recurringFee,
        });
      } catch (error) {
        console.error('Erro ao salvar contraproposta:', error);
      }
    }
  };

  // Aguardando verificação da API key
  if (hasApiKey === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Usuário não tem API key configurada
  if (!hasApiKey) {
    return (
      <GeminiApiKeyDialog 
        userId={user?.id || ''} 
        onApiKeySaved={() => setHasApiKey(true)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">IA Budget Generator</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/history')}>
              Histórico
            </Button>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!quote ? (
          <QuoteForm onSubmit={handleGenerateQuote} isLoading={isLoading} />
        ) : (
          <div className="space-y-6">
            <ResultSection quote={quote} projectData={projectData} quoteId={quoteId} isLoading={false} />

            {!counterOfferAnalysis ? (
              <CounterOfferSection
                quote={quote}
                projectData={projectData!}
                quoteId={quoteId}
                onAnalysisComplete={handleAnalysisComplete}
              />
            ) : (
              <CounterOfferAnalysis analysis={counterOfferAnalysis} />
            )}

            <Button
              variant="outline"
              onClick={() => {
                setQuote(null);
                setProjectData(null);
                setQuoteId(null);
                setCounterOfferAnalysis(null);
              }}
              className="w-full"
            >
              Gerar Novo Orçamento
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
