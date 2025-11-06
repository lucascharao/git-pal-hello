export type ToolCostType = 'Custo Único' | 'Custo Mensal';

export interface Tool {
  id: string;
  name: string;
  cost: number;
  costType: ToolCostType;
}

export interface ProjectData {
  clientValue: string;
  clientSize: 'Startup' | 'Pequena Empresa' | 'Média Empresa' | 'Grande Corporação';
  duration: number;
  tools: Tool[];
  complexity: 'Baixa' | 'Média' | 'Alta' | 'Muito Alta';
  urgency: 'Normal' | 'Urgente' | 'Data Crítica';
  integrationNeeds: 'Nenhuma' | 'Simples (APIs públicas)' | 'Complexa (Sistemas legados, ERPs)';
  securityLevel: 'Padrão' | 'Elevada (Dados sensíveis)' | 'Máxima (Financeiro/Saúde)';
  teamSize: number;
  teamSeniority: 'Júnior-Pleno' | 'Pleno-Sênior' | 'Especialistas';
  supportLevel: 'Básico (Horário comercial)' | 'Estendido (24/5)' | 'Premium (24/7)';
  desiredMargin: number;
  annualRevenue: string;
  processToOptimize: string;
  timeSpent: number;
  peopleInvolved: number;
  estimatedLoss: number;
}

export interface Quote {
  implementationFee: number;
  recurringFee: number;
  reasoning: string;
}

export interface ClientCounterOffer {
  implementation: number;
  recurring: number;
}

export enum Recommendation {
  ACCEPT = 'ACCEPT',
  COUNTER = 'COUNTER',
  DECLINE = 'DECLINE'
}

export interface CounterOfferAnalysis {
  analysis: string;
  recommendation: Recommendation;
  suggestedResponse: string;
  newOffer?: {
    implementationFee: number;
    recurringFee: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PdfInfo {
  clientName: string;
  projectTitle: string;
  additionalNotes?: string;
}
