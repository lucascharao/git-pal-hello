import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { Spinner } from '@/components/Spinner';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const formatWhatsApp = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2');
    }
    return value;
  };

  const passwordValidation = useMemo(() => ({
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    isLongEnough: password.length >= 8,
  }), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup({ email, password, fullName, whatsapp });

      if (result.error) {
        toast({ variant: 'destructive', title: 'Erro ao criar conta', description: result.error });
        return;
      }

      toast({ title: 'Conta criada!', description: 'Bem-vindo ao IA Budget Generator.' });
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
          <h1 className="mt-4 text-3xl font-bold text-foreground tracking-tight">Criar Nova Conta</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-lg border border-border">
          <div>
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" disabled={isLoading} required />
          </div>

          <div>
            <Label htmlFor="email">E-mail *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" disabled={isLoading} required />
          </div>

          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))} placeholder="(11) 99999-9999" disabled={isLoading} />
          </div>

          <div>
            <Label htmlFor="password">Senha *</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={isLoading} required />
            {password && (
              <ul className="mt-2 space-y-1 text-xs">
                <li className={passwordValidation.isLongEnough ? 'text-green-500' : 'text-muted-foreground'}>Mínimo 8 caracteres</li>
                <li className={passwordValidation.hasUpperCase ? 'text-green-500' : 'text-muted-foreground'}>Uma letra maiúscula</li>
                <li className={passwordValidation.hasLowerCase ? 'text-green-500' : 'text-muted-foreground'}>Uma letra minúscula</li>
                <li className={passwordValidation.hasNumber ? 'text-green-500' : 'text-muted-foreground'}>Um número</li>
                <li className={passwordValidation.hasSpecialChar ? 'text-green-500' : 'text-muted-foreground'}>Um caractere especial</li>
              </ul>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" /> : 'Criar Conta'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Já tem uma conta? </span>
            <Button variant="link" className="p-0" onClick={() => navigate('/login')}>Fazer login</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
