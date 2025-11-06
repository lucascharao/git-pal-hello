import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from './Spinner';
import type { ProjectData, Tool, ToolCostType } from '@/types';
import { Card } from '@/components/ui/card';

interface QuoteFormProps {
  onSubmit: (data: ProjectData) => void;
  isLoading: boolean;
}

export function QuoteForm({ onSubmit, isLoading }: QuoteFormProps) {
  const [formData, setFormData] = useState<ProjectData>({
    clientValue: '',
    clientSize: 'Média Empresa',
    duration: 160,
    tools: [
      { id: crypto.randomUUID(), name: 'Servidor de Produção (AWS)', cost: 500, costType: 'Custo Mensal' as ToolCostType },
      { id: crypto.randomUUID(), name: 'Licença de Software X', cost: 2000, costType: 'Custo Único' as ToolCostType },
    ],
    complexity: 'Média',
    urgency: 'Normal',
    integrationNeeds: 'Simples (APIs públicas)',
    securityLevel: 'Padrão',
    teamSize: 2,
    teamSeniority: 'Pleno-Sênior',
    supportLevel: 'Básico (Horário comercial)',
    desiredMargin: 30,
    annualRevenue: 'R$ 5-20 milhões',
    processToOptimize: 'Envio manual de orçamentos para clientes',
    timeSpent: 40,
    peopleInvolved: 2,
    estimatedLoss: 25000,
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
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="clientValue">Valor percebido pelo cliente</Label>
          <Input
            id="clientValue"
            value={formData.clientValue}
            onChange={(e) => setFormData({ ...formData, clientValue: e.target.value })}
            placeholder="Ex: Economia de 5h/dia no processo"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tamanho do Cliente</Label>
            <Select value={formData.clientSize} onValueChange={(value: any) => setFormData({ ...formData, clientSize: value })}>
              <SelectTrigger>
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
            <Label htmlFor="duration">Duração (horas)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              required
            />
          </div>
        </div>

        <div>
          <Label>Ferramentas e Custos</Label>
          <div className="space-y-2 mt-2">
            {formData.tools.map((tool) => (
              <div key={tool.id} className="flex gap-2">
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
                <Select value={tool.costType} onValueChange={(value: ToolCostType) => updateTool(tool.id, 'costType', value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Custo Único">Único</SelectItem>
                    <SelectItem value="Custo Mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="destructive" size="icon" onClick={() => removeTool(tool.id)}>×</Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addTool} className="w-full">
              + Adicionar Ferramenta
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Complexidade</Label>
            <Select value={formData.complexity} onValueChange={(value: any) => setFormData({ ...formData, complexity: value })}>
              <SelectTrigger>
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
            <Label>Urgência</Label>
            <Select value={formData.urgency} onValueChange={(value: any) => setFormData({ ...formData, urgency: value })}>
              <SelectTrigger>
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

        <div>
          <Label htmlFor="desiredMargin">Margem Desejada (%)</Label>
          <Input
            id="desiredMargin"
            type="number"
            value={formData.desiredMargin}
            onChange={(e) => setFormData({ ...formData, desiredMargin: Number(e.target.value) })}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Spinner size="sm" /> : 'Gerar Orçamento'}
        </Button>
      </form>
    </Card>
  );
}
