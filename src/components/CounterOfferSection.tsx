import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './ui/use-toast';
import type { Quote, ProjectData, CounterOfferAnalysis } from '@/types';
import { Loader2 } from 'lucide-react';

interface CounterOfferSectionProps {
  quote: Quote;
  projectData: ProjectData;
  quoteId: string | null;
  onAnalysisComplete: (analysis: CounterOfferAnalysis, clientOffer: { implementation: number; recurring: number }) => void;
}

export function CounterOfferSection({ quote, projectData, quoteId, onAnalysisComplete }: CounterOfferSectionProps) {
  const [implementation, setImplementation] = useState('');
  const [recurring, setRecurring] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!implementation || !recurring) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha os valores da contraproposta",
        variant: "destructive",
      });
      return;
    }

    const implementationValue = parseFloat(implementation.replace(/\D/g, ''));
    const recurringValue = parseFloat(recurring.replace(/\D/g, ''));

    if (isNaN(implementationValue) || isNaN(recurringValue)) {
      toast({
        title: "Valores inválidos",
        description: "Digite valores numéricos válidos",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-counter-offer', {
        body: {
          originalQuote: quote,
          counterOffer: {
            implementation: implementationValue,
            recurring: recurringValue,
          },
          projectData,
        },
      });

      if (error) throw error;

      onAnalysisComplete(data, {
        implementation: implementationValue,
        recurring: recurringValue,
      });
      
      toast({
        title: "Análise concluída",
        description: "Chris Voss AI analisou a contraproposta",
      });
    } catch (error) {
      console.error('Error analyzing counter-offer:', error);
      toast({
        title: "Erro ao analisar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(parseInt(numbers || '0'));
    return formatted;
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-2">Recebeu Contraproposta?</h3>
        <p className="text-sm text-muted-foreground">
          Insira os valores propostos pelo cliente para análise estratégica Chris Voss
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="counter-implementation">Valor de Implementação Proposto</Label>
          <Input
            id="counter-implementation"
            type="text"
            placeholder="R$ 0"
            value={implementation}
            onChange={(e) => setImplementation(formatCurrency(e.target.value))}
            disabled={isAnalyzing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="counter-recurring">Valor Mensal Proposto</Label>
          <Input
            id="counter-recurring"
            type="text"
            placeholder="R$ 0"
            value={recurring}
            onChange={(e) => setRecurring(formatCurrency(e.target.value))}
            disabled={isAnalyzing}
          />
        </div>
      </div>

      <Button 
        onClick={handleAnalyze} 
        disabled={isAnalyzing}
        className="w-full"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analisando com Chris Voss AI...
          </>
        ) : (
          'Analisar Contraproposta'
        )}
      </Button>
    </Card>
  );
}
