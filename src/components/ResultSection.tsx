import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { ChatDialog } from './ChatDialog';
import type { Quote, ProjectData } from '@/types';

interface ResultSectionProps {
  quote: Quote;
  projectData: ProjectData;
  isLoading: boolean;
}

export function ResultSection({ quote, projectData, isLoading }: ResultSectionProps) {
  const [chatOpen, setChatOpen] = useState(false);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Orçamento Gerado</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChatOpen(true)}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Chat com Chris Voss
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-sm text-muted-foreground mb-1">Taxa de Implementação</div>
            <div className="text-3xl font-bold text-primary">
              R$ {quote.implementationFee.toLocaleString('pt-BR')}
            </div>
          </div>

          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-sm text-muted-foreground mb-1">Taxa Mensal Recorrente</div>
            <div className="text-3xl font-bold text-primary">
              R$ {quote.recurringFee.toLocaleString('pt-BR')}/mês
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <h3 className="font-semibold mb-2">Justificativa</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {quote.reasoning}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <h3 className="font-semibold mb-3">Resumo do Projeto</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Cliente:</span>
              <span className="ml-2">{projectData.clientSize}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Duração:</span>
              <span className="ml-2">{projectData.duration}h</span>
            </div>
            <div>
              <span className="text-muted-foreground">Complexidade:</span>
              <span className="ml-2">{projectData.complexity}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Urgência:</span>
              <span className="ml-2">{projectData.urgency}</span>
            </div>
          </div>
        </div>
      </Card>

      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        quote={quote}
        projectData={projectData}
      />
    </>
  );
}
