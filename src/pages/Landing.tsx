import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="py-6 px-4 sm:px-6 lg:px-8 sticky top-0 z-30 bg-background/70 backdrop-blur-sm border-b border-border">
        <nav className="flex items-center justify-between container mx-auto">
          <div className="flex items-center">
            <LogoIcon className="h-8 w-8 text-primary" />
            <span className="ml-3 text-2xl font-bold tracking-tight">IA Budget Generator</span>
          </div>
          <div className="space-x-2 sm:space-x-4">
            <Button variant="outline" onClick={() => navigate('/login')}>Entrar</Button>
            <Button onClick={() => navigate('/signup')}>Começar Grátis</Button>
          </div>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Gere Orçamentos Profissionais{' '}
              <span className="text-primary">com Inteligência Artificial</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Crie orçamentos detalhados e estratégicos em minutos. Maximize seu ROI e negocie com confiança.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/signup')} className="text-lg px-8">
                Começar Agora
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="text-lg px-8">
                Fazer Login
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 border-t border-border">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Recursos Principais</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-lg bg-card border border-border">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-bold mb-2">IA Avançada</h3>
                <p className="text-muted-foreground">
                  Powered by Gemini AI para análises precisas e sugestões estratégicas
                </p>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold mb-2">ROI Otimizado</h3>
                <p className="text-muted-foreground">
                  Calcule e demonstre o retorno sobre investimento para seus clientes
                </p>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold mb-2">Análise Completa</h3>
                <p className="text-muted-foreground">
                  Considere complexidade, urgência, segurança e mais de 15 fatores
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 IA Budget Generator. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
