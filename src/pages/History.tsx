import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ArrowLeft, MessageCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface QuoteHistory {
  id: string;
  client_value: string;
  client_size: string;
  complexity: string;
  implementation_fee: number;
  recurring_fee: number;
  created_at: string;
  counter_offers: Array<{ recommendation: string; created_at: string }>;
  chat_message_count: number;
}

export default function History() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<QuoteHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.listQuotes();
      setQuotes(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'ACCEPT': return 'bg-green-500';
      case 'COUNTER': return 'bg-yellow-500';
      case 'DECLINE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
              <ArrowLeft className="h-4 w-4 mr-2" />Voltar
            </Button>
            <div className="flex items-center gap-2">
              <LogoIcon className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Histórico de Orçamentos</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={handleLogout}>Sair</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6"><div className="space-y-3"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div></Card>
            ))}
          </div>
        ) : quotes.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum orçamento encontrado</h3>
            <p className="text-muted-foreground mb-4">Você ainda não gerou nenhum orçamento.</p>
            <Button onClick={() => navigate('/app')}>Gerar Primeiro Orçamento</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <Card key={quote.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{quote.client_value}</h3>
                      <Badge variant="outline">{quote.client_size}</Badge>
                      <Badge variant="secondary">{quote.complexity}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Implementação</p>
                        <p className="text-xl font-bold text-primary">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.implementation_fee)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Recorrência</p>
                        <p className="text-xl font-bold text-primary">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.recurring_fee)}/mês
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{format(new Date(quote.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                      {quote.chat_message_count > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{quote.chat_message_count} mensagens no chat</span>
                        </div>
                      )}
                      {quote.counter_offers?.length > 0 && (
                        <div className="flex items-center gap-2">
                          {quote.counter_offers.map((offer, index) => (
                            <Badge key={index} className={getRecommendationColor(offer.recommendation)}>{offer.recommendation}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
