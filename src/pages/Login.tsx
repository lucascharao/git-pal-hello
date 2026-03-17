import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { Spinner } from '@/components/Spinner';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Preencha email e senha.' });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.error) {
        toast({ variant: 'destructive', title: 'Erro ao fazer login', description: result.error });
        return;
      }

      toast({ title: 'Login realizado!', description: 'Bem-vindo de volta.' });
      navigate('/app');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro de conexão. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <LogoIcon className="h-10 w-10 text-primary" />
          <h1 className="mt-4 text-3xl font-bold text-foreground tracking-tight">Acesse sua Conta</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-lg border border-border">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" disabled={isLoading} required />
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={isLoading} required />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" /> : 'Entrar'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Não tem uma conta? </span>
            <Button variant="link" className="p-0" onClick={() => navigate('/signup')}>Cadastre-se</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
