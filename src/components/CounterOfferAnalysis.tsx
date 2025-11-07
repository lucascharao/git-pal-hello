import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import type { CounterOfferAnalysis, Recommendation } from '@/types';
import { CheckCircle2, AlertCircle, XCircle, Copy } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface CounterOfferAnalysisProps {
  analysis: CounterOfferAnalysis;
}

export function CounterOfferAnalysis({ analysis }: CounterOfferAnalysisProps) {
  const { toast } = useToast();

  const getRecommendationDetails = (recommendation: Recommendation) => {
    switch (recommendation) {
      case 'ACCEPT':
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          label: 'ACEITAR',
          color: 'bg-green-500',
          description: 'Recomendação: Aceitar a proposta do cliente',
        };
      case 'COUNTER':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          label: 'CONTRA-OFERECER',
          color: 'bg-yellow-500',
          description: 'Recomendação: Fazer uma contra-oferta',
        };
      case 'DECLINE':
        return {
          icon: <XCircle className="h-5 w-5" />,
          label: 'RECUSAR',
          color: 'bg-red-500',
          description: 'Recomendação: Recusar e oferecer alternativa',
        };
    }
  };

  const details = getRecommendationDetails(analysis.recommendation);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(analysis.suggestedResponse);
      toast({
        title: "Copy copiada!",
        description: "Mensagem copiada para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a mensagem",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`${details.color} text-white p-2 rounded-full`}>
            {details.icon}
          </div>
          <div>
            <Badge variant="outline" className="mb-1">
              {details.label}
            </Badge>
            <p className="text-sm text-muted-foreground">{details.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Análise Estratégica Chris Voss</h4>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
              {analysis.analysis}
            </div>
          </div>

          {analysis.newOffer && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Nova Proposta Sugerida</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Implementação</p>
                  <p className="text-xl font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(analysis.newOffer.implementationFee)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recorrência Mensal</p>
                  <p className="text-xl font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(analysis.newOffer.recurringFee)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Copy para o Cliente</h4>
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </Button>
        </div>
        <div className="bg-muted p-4 rounded-md">
          <pre className="whitespace-pre-wrap text-sm font-mono text-foreground">
            {analysis.suggestedResponse}
          </pre>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Esta mensagem foi gerada usando técnicas de negociação do FBI adaptadas por Chris Voss AI
        </p>
      </Card>
    </div>
  );
}
