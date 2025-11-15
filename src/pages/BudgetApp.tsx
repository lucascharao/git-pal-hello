import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { QuoteForm } from '@/components/QuoteForm';
import { ResultSection } from '@/components/ResultSection';
import { CounterOfferSection } from '@/components/CounterOfferSection';
import { CounterOfferAnalysis } from '@/components/CounterOfferAnalysis';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { useQuoteLimit } from '@/hooks/useQuoteLimit';
import type { ProjectData, Quote, CounterOfferAnalysis as CounterOfferAnalysisType } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function BudgetApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canCreateQuote, isFreemium, loading: limitLoading, refreshQuoteLimit } = useQuoteLimit();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [counterOfferAnalysis, setCounterOfferAnalysis] = useState<CounterOfferAnalysisType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleGenerateQuote = async (data: ProjectData) => {
    // Check if user can create a quote
    if (!canCreateQuote) {
      setShowUpgradeDialog(true);
      return;
    }

    setIsLoading(true);
    setQuote(null);
    setProjectData(data);

    try {
      const { data: response, error } = await supabase.functions.invoke('generate-quote', {
        body: { projectData: data }
      });

      if (error) throw error;

      setQuote(response);

      // Salvar orçamento no banco de dados
      const { data: savedQuote, error: saveError } = await supabase
        .from('quotes')
        .insert([{
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
        }])
        .select()
        .single();

      if (saveError) throw saveError;
      setQuoteId(savedQuote.id);

      // Refresh quote limit after creating a quote
      await refreshQuoteLimit();

      toast({
        title: 'Orçamento gerado!',
        description: 'Seu orçamento foi criado com sucesso.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar orçamento',
        description: error.message || 'Ocorreu um erro. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisComplete = async (analysis: CounterOfferAnalysisType, clientOffer: { implementation: number; recurring: number }) => {
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">IA Budget Generator</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/history')}
            >
              Histórico
            </Button>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={handleLogout}>Sair</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!quote ? (
          <QuoteForm onSubmit={handleGenerateQuote} isLoading={isLoading} />
        ) : (
          <div className="space-y-6">
            <ResultSection
              quote={quote}
              projectData={projectData}
              quoteId={quoteId}
              isLoading={false}
            />
            
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

      <UpgradeDialog 
        open={showUpgradeDialog} 
        onOpenChange={setShowUpgradeDialog}
      />
    </div>
  );
}
