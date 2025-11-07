import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { Spinner } from '@/components/Spinner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const signupSchema = z.object({
  fullName: z.string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .trim()
    .email('E-mail inválido')
    .max(255, 'E-mail deve ter no máximo 255 caracteres'),
  whatsapp: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$|^\(\d{2}\)\s?9?\d{4}-?\d{4}$/, 
      'WhatsApp inválido. Use formato: (11) 99999-9999 ou +5511999999999'
    ),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
});

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const formatWhatsApp = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d)(\d{4})$/, '$1-$2');
    }
    return value;
  };

  const passwordValidation = useMemo(() => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    return { hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar, isLongEnough };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      signupSchema.parse({ fullName, email, whatsapp, password });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: 'destructive',
          title: 'Erro de validação',
          description: error.errors[0].message,
        });
        return;
      }
    }

    setIsLoading(true);
    
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
          data: {
            full_name: fullName,
            whatsapp: whatsapp,
          }
        },
      });

      if (error) throw error;

      // Enviar notificação por email
      if (data.user) {
        try {
          await supabase.functions.invoke('notify-new-user', {
            body: {
              fullName,
              email,
              whatsapp,
            },
          });
        } catch (notifyError) {
          console.error('Erro ao enviar notificação:', notifyError);
          // Não bloqueia o cadastro se a notificação falhar
        }
      }

      toast({
        title: 'Conta criada!',
        description: 'Verifique seu e-mail para confirmar sua conta.',
      });
      
      navigate('/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conta',
        description: error.message || 'Ocorreu um erro. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <LogoIcon className="h-10 w-10 text-primary" />
          <h1 className="mt-4 text-3xl font-bold text-foreground tracking-tight">
            Criar Nova Conta
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-lg border border-border">
          <div>
            <Label htmlFor="fullName">Nome Completo *</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Você receberá um código de verificação neste e-mail
            </p>
          </div>

          <div>
            <Label htmlFor="whatsapp">WhatsApp *</Label>
            <Input
              id="whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
              placeholder="(11) 99999-9999"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formato: (11) 99999-9999 ou +5511999999999
            </p>
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              required
            />
            {password && (
              <ul className="mt-2 space-y-1 text-xs">
                <li className={passwordValidation.isLongEnough ? 'text-green-500' : 'text-muted-foreground'}>
                  ✓ Mínimo 8 caracteres
                </li>
                <li className={passwordValidation.hasUpperCase ? 'text-green-500' : 'text-muted-foreground'}>
                  ✓ Uma letra maiúscula
                </li>
                <li className={passwordValidation.hasLowerCase ? 'text-green-500' : 'text-muted-foreground'}>
                  ✓ Uma letra minúscula
                </li>
                <li className={passwordValidation.hasNumber ? 'text-green-500' : 'text-muted-foreground'}>
                  ✓ Um número
                </li>
                <li className={passwordValidation.hasSpecialChar ? 'text-green-500' : 'text-muted-foreground'}>
                  ✓ Um caractere especial
                </li>
              </ul>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" /> : 'Criar Conta'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Já tem uma conta? </span>
            <Button variant="link" className="p-0" onClick={() => navigate('/login')}>
              Fazer login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
