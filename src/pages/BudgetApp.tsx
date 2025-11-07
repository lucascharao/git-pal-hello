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
import type { ProjectData, Quote, CounterOfferAnalysis as CounterOfferAnalysisType } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function BudgetApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [counterOfferAnalysis, setCounterOfferAnalysis] = useState<CounterOfferAnalysisType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleGenerateQuote = async (data: ProjectData) => {
    setIsLoading(true);
    setQuote(null);
    setProjectData(data);

    try {
      const { data: response, error } = await supabase.functions.invoke('generate-quote', {
        body: { projectData: data }
      });

      if (error) throw error;

      setQuote(response);
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

  const handleAnalysisComplete = (analysis: CounterOfferAnalysisType) => {
    setCounterOfferAnalysis(analysis);
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
              isLoading={false}
            />
            
            {!counterOfferAnalysis ? (
              <CounterOfferSection 
                quote={quote}
                projectData={projectData!}
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
