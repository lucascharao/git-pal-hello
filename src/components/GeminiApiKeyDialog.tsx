import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/Spinner';

interface GeminiApiKeyDialogProps {
  userId: string;
  onApiKeySaved: () => void;
}

const GeminiApiKeyDialog = ({ userId, onApiKeySaved }: GeminiApiKeyDialogProps) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira sua chave API do Gemini.",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey.startsWith('AIza')) {
      toast({
        title: "Chave inválida",
        description: "A chave API do Gemini deve começar com 'AIza'.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ gemini_api_key: apiKey.trim() })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Sua chave API foi salva com sucesso.",
      });
      
      onApiKeySaved();
    } catch (error: any) {
      console.error('Error saving API key:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a chave API. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Configure sua API do Gemini</CardTitle>
          <CardDescription>
            Para usar o gerador de orçamentos, você precisa fornecer sua própria chave API do Google Gemini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Chave API do Gemini</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Como obter sua chave:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Acesse o Google AI Studio</li>
              <li>Faça login com sua conta Google</li>
              <li>Clique em "Get API Key"</li>
              <li>Copie a chave gerada</li>
            </ol>
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Obter chave no Google AI Studio
          </a>

          <Button 
            onClick={handleSaveApiKey} 
            className="w-full"
            disabled={isLoading || !apiKey.trim()}
          >
            {isLoading ? <Spinner /> : 'Salvar e Continuar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeminiApiKeyDialog;
