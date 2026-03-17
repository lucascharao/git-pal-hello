import { Button } from '@/components/ui/button';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { useNavigate } from 'react-router-dom';
import chrisVossImage from '@/assets/chris-voss.jpeg';

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
            <Button onClick={() => navigate('/signup')}>
              Teste Grátis
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24 bg-gradient-to-b from-background to-background/50">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Orçamentos Inteligentes{' '}
              <span className="text-primary block mt-2">com IA de Negociação</span>
            </h1>

            <p className="text-xl sm:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto font-medium">
              Gere orçamentos profissionais com justificativa de valor baseada em técnicas de negociação consagradas
            </p>

            <p className="text-lg text-muted-foreground/80 mb-10 max-w-2xl mx-auto">
              Preencha os dados do projeto e receba um orçamento completo com estratégia de precificação e argumentação de valor.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button
                size="lg"
                onClick={() => navigate('/signup')}
                className="text-lg px-10 py-7 text-white shadow-lg hover:shadow-xl transition-all"
              >
                Criar Conta Grátis
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="text-lg px-8 py-7"
              >
                Já Tenho Conta
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Gratuito para usar. Sem cartão de crédito.
            </p>
          </div>
        </section>

        {/* Chris Voss Section */}
        <section className="py-20 px-4 bg-card/30 border-y border-border">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight">
                  Negocie Como o <span className="text-primary">Melhor Negociador do FBI</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Nossa IA foi treinada com as técnicas de <strong>Chris Voss</strong>, ex-negociador do FBI e autor do best-seller "Negocie Como Se Sua Vida Dependesse Disso".
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">✅</div>
                    <div>
                      <h4 className="font-bold mb-1">Justificativa Inquestionável de Preço</h4>
                      <p className="text-muted-foreground">Defenda seu valor com argumentos psicológicos comprovados</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">✅</div>
                    <div>
                      <h4 className="font-bold mb-1">Copy de Negociação Persuasiva</h4>
                      <p className="text-muted-foreground">Scripts prontos que fazem o cliente dizer "sim" naturalmente</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">✅</div>
                    <div>
                      <h4 className="font-bold mb-1">Análise de Objeções Antecipada</h4>
                      <p className="text-muted-foreground">Responda dúvidas antes mesmo delas surgirem</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/10 rounded-2xl blur-2xl"></div>
                  <img 
                    src={chrisVossImage} 
                    alt="Chris Voss - Ex-Negociador Chefe do FBI" 
                    className="relative rounded-2xl shadow-2xl w-full object-cover aspect-[3/4]"
                  />
                  <div className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-sm p-4 rounded-lg">
                    <p className="text-white font-bold">Chris Voss</p>
                    <p className="text-white/80 text-sm">Ex-Negociador Chefe do FBI</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 px-4 bg-destructive/5 border-y border-destructive/20">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-destructive">
              Você Está Perdendo Até 40% De Faturamento
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              E nem percebe. Aqui está o que acontece quando você manda um orçamento "normal":
            </p>
            <div className="grid sm:grid-cols-3 gap-6 text-left">
              <div className="bg-background p-6 rounded-lg border border-destructive/20">
                <div className="text-3xl mb-3">😰</div>
                <h4 className="font-bold mb-2">Cliente Não Responde</h4>
                <p className="text-sm text-muted-foreground">Sem contexto ou urgência, seu orçamento vai direto pro arquivo</p>
              </div>
              <div className="bg-background p-6 rounded-lg border border-destructive/20">
                <div className="text-3xl mb-3">💸</div>
                <h4 className="font-bold mb-2">Sempre Pedem Desconto</h4>
                <p className="text-sm text-muted-foreground">Sem justificativa clara, seu preço parece um "chute"</p>
              </div>
              <div className="bg-background p-6 rounded-lg border border-destructive/20">
                <div className="text-3xl mb-3">🤯</div>
                <h4 className="font-bold mb-2">Você Perde Pro Mais Barato</h4>
                <p className="text-sm text-muted-foreground">Porque não mostrou o VALOR, só mostrou o preço</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-background">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                O Que Você Ganha <span className="text-primary">Usando Nossa Plataforma</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Não é só um gerador de orçamentos. É uma máquina de fechar vendas.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg">
                <div className="text-5xl mb-4">🧠</div>
                <h3 className="text-2xl font-bold mb-3">IA Chris Voss</h3>
                <p className="text-muted-foreground mb-4">
                  Técnicas comprovadas do FBI transformadas em IA. Cada orçamento é uma negociação estratégica.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">→</span>
                    <span>Ancoragem de preço</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">→</span>
                    <span>Espelhamento e calibração</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">→</span>
                    <span>Labels e perguntas calibradas</span>
                  </li>
                </ul>
              </div>

              <div className="p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg">
                <div className="text-5xl mb-4">💎</div>
                <h3 className="text-2xl font-bold mb-3">Justificativa Blindada</h3>
                <p className="text-muted-foreground mb-4">
                  Nunca mais seja questionado sobre "por que tão caro?". Mostre VALOR, não só preço.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">→</span>
                    <span>ROI calculado automaticamente</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">→</span>
                    <span>Análise de 15+ fatores de preço</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">→</span>
                    <span>Comparação com alternativas</span>
                  </li>
                </ul>
              </div>

              <div className="p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg">
                <div className="text-5xl mb-4">⚡</div>
                <h3 className="text-2xl font-bold mb-3">Copy Persuasiva Pronta</h3>
                <p className="text-muted-foreground mb-4">
                  Scripts de negociação testados em milhares de deals. Só copiar e enviar.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">→</span>
                    <span>Respostas para objeções comuns</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">→</span>
                    <span>Follow-ups automáticos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">→</span>
                    <span>Gatilhos de urgência e escassez</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 sm:p-12 text-center">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                Resultado: Você Fecha Mais, Mais Rápido, Por Mais Dinheiro
              </h3>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Em média, nossos usuários aumentam em <strong className="text-primary">37% a taxa de conversão</strong> e reduzem o ciclo de venda em <strong className="text-primary">53%</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 px-4 bg-gradient-to-t from-primary/5 to-background border-t border-border">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
              Comece a Gerar<br/>
              <span className="text-primary">Orçamentos Profissionais</span>
            </h2>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Crie sua conta gratuitamente e gere orçamentos inteligentes com IA em minutos.
            </p>

            <Button
              size="lg"
              onClick={() => navigate('/signup')}
              className="text-xl px-12 py-8 mb-6 shadow-xl hover:shadow-2xl transition-all"
            >
              Criar Conta Grátis
            </Button>

            <p className="text-sm text-muted-foreground mb-2">
              Acesso imediato. Sem cartão de crédito.
            </p>
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
