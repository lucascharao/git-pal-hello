import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Key } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/Spinner';

export type AiProvider = 'openai' | 'gemini' | 'anthropic';

interface ProviderOption {
  id: AiProvider;
  name: string;
  model: string;
  placeholder: string;
  helpUrl: string;
  helpLabel: string;
}

const PROVIDERS: ProviderOption[] = [
  { id: 'openai', name: 'OpenAI', model: 'gpt-4.1-mini', placeholder: 'sk-...', helpUrl: 'https://platform.openai.com/api-keys', helpLabel: 'Obter chave na OpenAI' },
  { id: 'gemini', name: 'Google Gemini', model: 'gemini-2.5-flash', placeholder: 'AIza...', helpUrl: 'https://aistudio.google.com/app/apikey', helpLabel: 'Obter chave no Google AI Studio' },
  { id: 'anthropic', name: 'Anthropic', model: 'claude-sonnet-4-5-20250514', placeholder: 'sk-ant-...', helpUrl: 'https://console.anthropic.com/settings/keys', helpLabel: 'Obter chave na Anthropic' },
];

interface ApiKeyDialogProps {
  userId: string;
  onApiKeySaved: () => void;
}

const ApiKeyDialog = ({ userId, onApiKeySaved }: ApiKeyDialogProps) => {
  const [selectedProvider, setSelectedProvider] = useState<AiProvider | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const provider = PROVIDERS.find((p) => p.id === selectedProvider);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim() || !selectedProvider || !provider) {
      toast({ title: 'Erro', description: 'Selecione um provider e insira sua chave API.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.saveApiKey(apiKey.trim());
      if (result.error) throw new Error(result.error);

      localStorage.setItem('ai_provider', selectedProvider);
      toast({ title: 'Sucesso!', description: `Chave ${provider.name} salva com sucesso.` });
      onApiKeySaved();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Não foi possível salvar a chave API.', variant: 'destructive' });
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
          <CardTitle className="text-xl">Configure sua IA</CardTitle>
          <CardDescription>Escolha o provider de IA e insira sua chave API para gerar orçamentos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Provider de IA</Label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelectedProvider(p.id); setApiKey(''); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-all ${
                    selectedProvider === p.id ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.model}</span>
                </button>
              ))}
            </div>
          </div>

          {provider && (
            <>
              <div className="space-y-2">
                <Label htmlFor="apiKey">Chave API — {provider.name}</Label>
                <Input id="apiKey" type="password" placeholder={provider.placeholder} value={apiKey} onChange={(e) => setApiKey(e.target.value)} disabled={isLoading} />
              </div>
              <a href={provider.helpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                {provider.helpLabel}
              </a>
              <Button onClick={handleSaveApiKey} className="w-full" disabled={isLoading || !apiKey.trim()}>
                {isLoading ? <Spinner /> : 'Salvar e Continuar'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyDialog;
