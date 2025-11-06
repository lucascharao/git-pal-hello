import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from './Spinner';
import type { ProjectData, Tool, ToolCostType } from '@/types';

interface QuoteFormProps {
  onSubmit: (data: ProjectData) => void;
  isLoading: boolean;
}

export function QuoteForm({ onSubmit, isLoading }: QuoteFormProps) {
  const [formData, setFormData] = useState<ProjectData>({
    annualRevenue: '',
    estimatedLoss: 0,
    processToOptimize: '',
    timeSpent: 0,
    peopleInvolved: 0,
    clientValue: '',
    clientSize: 'Média Empresa',
    urgency: 'Normal',
    integrationNeeds: 'Simples (APIs públicas)',
    securityLevel: 'Padrão',
    complexity: 'Média',
    teamSeniority: 'Pleno-Sênior',
    duration: 160,
    teamSize: 2,
    supportLevel: 'Básico (Horário comercial)',
    desiredMargin: 30,
    tools: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTool = () => {
    setFormData({
      ...formData,
      tools: [...formData.tools, { id: crypto.randomUUID(), name: '', cost: 0, costType: 'Custo Mensal' }]
    });
  };

  const removeTool = (id: string) => {
    setFormData({
      ...formData,
      tools: formData.tools.filter(t => t.id !== id)
    });
  };

  const updateTool = (id: string, field: keyof Tool, value: any) => {
    setFormData({
      ...formData,
      tools: formData.tools.map(t => t.id === id ? { ...t, [field]: value } : t)
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-center">Descreva Seu Projeto</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Métricas de Impacto no Negócio */}
        <div className="space-y-6 p-6 border border-border rounded-lg bg-card">
          <h3 className="text-xl font-semibold">Métricas de Impacto no Negócio</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="annualRevenue" className="text-muted-foreground">
                Faturamento Anual do Cliente
              </Label>
              <Input
                id="annualRevenue"
                type="text"
                value={formData.annualRevenue}
                onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
                placeholder="Ex: R$ 10 milhões"
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="estimatedLoss" className="text-muted-foreground">
                Custo/Perda Mensal Estimada (R$)
              </Label>
              <Input
                id="estimatedLoss"
                type="number"
                value={formData.estimatedLoss}
                onChange={(e) => setFormData({ ...formData, estimatedLoss: Number(e.target.value) })}
                min="0"
                required
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="processToOptimize" className="text-muted-foreground">
              Processo a ser Otimizado
            </Label>
            <Input
              id="processToOptimize"
              type="text"
              value={formData.processToOptimize}
              onChange={(e) => setFormData({ ...formData, processToOptimize: e.target.value })}
              placeholder="Envio manual de orçamentos para clientes"
              required
              className="mt-2"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timeSpent" className="text-muted-foreground">
                Tempo Gasto Atualmente (horas/mês)
              </Label>
              <Input
                id="timeSpent"
                type="number"
                value={formData.timeSpent}
                onChange={(e) => setFormData({ ...formData, timeSpent: Number(e.target.value) })}
                min="0"
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="peopleInvolved" className="text-muted-foreground">
                Pessoas Envolvidas no Processo
              </Label>
              <Input
                id="peopleInvolved"
                type="number"
                value={formData.peopleInvolved}
                onChange={(e) => setFormData({ ...formData, peopleInvolved: Number(e.target.value) })}
                min="0"
                required
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Detalhes do Cliente */}
        <div className="space-y-6 p-6 border border-border rounded-lg bg-card">
          <h3 className="text-xl font-semibold">Detalhes do Cliente</h3>
          
          <div>
            <Label htmlFor="clientValue" className="text-muted-foreground">
              Proposta de Valor para o Cliente
            </Label>
            <Textarea
              id="clientValue"
              value={formData.clientValue}
              onChange={(e) => setFormData({ ...formData, clientValue: e.target.value })}
              placeholder="Ex: Reduzir o tempo de envio de orçamentos de 5 dias para 10 minutos, aumentando a taxa de conversão."
              required
              className="mt-2 min-h-[100px]"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Tamanho do Cliente</Label>
              <Select 
                value={formData.clientSize} 
                onValueChange={(value: any) => setFormData({ ...formData, clientSize: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Startup">Startup</SelectItem>
                  <SelectItem value="Pequena Empresa">Pequena Empresa</SelectItem>
                  <SelectItem value="Média Empresa">Média Empresa</SelectItem>
                  <SelectItem value="Grande Corporação">Grande Corporação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-muted-foreground">Urgência do Projeto</Label>
              <Select 
                value={formData.urgency} 
                onValueChange={(value: any) => setFormData({ ...formData, urgency: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                  <SelectItem value="Data Crítica">Data Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Necessidades de Integração</Label>
              <Select 
                value={formData.integrationNeeds} 
                onValueChange={(value: any) => setFormData({ ...formData, integrationNeeds: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nenhuma">Nenhuma</SelectItem>
                  <SelectItem value="Simples (APIs públicas)">Simples (APIs públicas)</SelectItem>
                  <SelectItem value="Complexa (Sistemas legados, ERPs)">Complexa (Sistemas legados, ERPs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-muted-foreground">Nível de Segurança</Label>
              <Select 
                value={formData.securityLevel} 
                onValueChange={(value: any) => setFormData({ ...formData, securityLevel: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Padrão">Padrão</SelectItem>
                  <SelectItem value="Elevada (Dados sensíveis)">Elevada (Dados sensíveis)</SelectItem>
                  <SelectItem value="Máxima (Financeiro/Saúde)">Máxima (Financeiro/Saúde)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Parâmetros da Equipe & Ferramentas */}
        <div className="space-y-6 p-6 border border-border rounded-lg bg-card">
          <h3 className="text-xl font-semibold">Parâmetros da Equipe & Ferramentas</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Complexidade do Projeto</Label>
              <Select 
                value={formData.complexity} 
                onValueChange={(value: any) => setFormData({ ...formData, complexity: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Muito Alta">Muito Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-muted-foreground">Senioridade da Equipe</Label>
              <Select 
                value={formData.teamSeniority} 
                onValueChange={(value: any) => setFormData({ ...formData, teamSeniority: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Júnior-Pleno">Júnior-Pleno</SelectItem>
                  <SelectItem value="Pleno-Sênior">Pleno-Sênior</SelectItem>
                  <SelectItem value="Especialistas">Especialistas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration" className="text-muted-foreground">
                Duração Estimada (horas)
              </Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="teamSize" className="text-muted-foreground">
                Tamanho da Equipe
              </Label>
              <Input
                id="teamSize"
                type="number"
                value={formData.teamSize}
                onChange={(e) => setFormData({ ...formData, teamSize: Number(e.target.value) })}
                required
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Nível de Suporte Pós-Lançamento</Label>
              <Select 
                value={formData.supportLevel} 
                onValueChange={(value: any) => setFormData({ ...formData, supportLevel: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Básico (Horário comercial)">Básico (Horário comercial)</SelectItem>
                  <SelectItem value="Estendido (24/5)">Estendido (24/5)</SelectItem>
                  <SelectItem value="Premium (24/7)">Premium (24/7)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="desiredMargin" className="text-muted-foreground">
                Margem de Lucro Desejada (%)
              </Label>
              <Input
                id="desiredMargin"
                type="number"
                value={formData.desiredMargin}
                onChange={(e) => setFormData({ ...formData, desiredMargin: Number(e.target.value) })}
                required
                className="mt-2"
              />
            </div>
          </div>
        </div>

        {/* Ferramentas & Tecnologias */}
        <div className="space-y-6 p-6 border border-border rounded-lg bg-card">
          <h3 className="text-xl font-semibold">Ferramentas & Tecnologias (Custos Fixos)</h3>
          
          <div className="space-y-3">
            {formData.tools.map((tool) => (
              <div key={tool.id} className="grid grid-cols-[1fr,auto,auto,auto] gap-3">
                <Input
                  placeholder="Nome da ferramenta"
                  value={tool.name}
                  onChange={(e) => updateTool(tool.id, 'name', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Custo"
                  value={tool.cost}
                  onChange={(e) => updateTool(tool.id, 'cost', Number(e.target.value))}
                  className="w-32"
                />
                <Select 
                  value={tool.costType} 
                  onValueChange={(value: ToolCostType) => updateTool(tool.id, 'costType', value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Custo Único">Custo Único</SelectItem>
                    <SelectItem value="Custo Mensal">Custo Mensal</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeTool(tool.id)}
                  className="text-destructive hover:text-destructive"
                >
                  ×
                </Button>
              </div>
            ))}
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={addTool} 
              className="w-full border-dashed border-primary text-primary hover:bg-primary/10"
            >
              Adicionar Ferramenta +
            </Button>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-14 text-lg" 
          disabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : 'Gerar Orçamento com IA'}
        </Button>
      </form>
    </div>
  );
}
