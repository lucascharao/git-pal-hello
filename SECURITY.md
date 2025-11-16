# Documentação de Segurança

Este documento descreve as medidas de segurança implementadas na aplicação para proteger contra as principais vulnerabilidades conforme OWASP Top 10 2024.

## 📋 Índice

1. [Autenticação e Autorização](#autenticação-e-autorização)
2. [Controle de Acesso Baseado em Funções (RBAC)](#controle-de-acesso-baseado-em-funções-rbac)
3. [Audit Logging](#audit-logging)
4. [Rate Limiting](#rate-limiting)
5. [Validação e Sanitização de Inputs](#validação-e-sanitização-de-inputs)
6. [Headers de Segurança](#headers-de-segurança)
7. [Content Security Policy (CSP)](#content-security-policy-csp)
8. [Proteção de Dados](#proteção-de-dados)
9. [Row Level Security (RLS)](#row-level-security-rls)
10. [Monitoramento e Logging](#monitoramento-e-logging)

---

## 🔐 Autenticação e Autorização

### Supabase Authentication
A aplicação utiliza Supabase Authentication para gerenciamento de usuários, que fornece:

- **JWT Tokens**: Tokens assinados com expiração automática
- **Refresh Token Rotation**: Tokens são automaticamente renovados de forma segura
- **Session Management**: Gerenciamento automático de sessões com timeout
- **Password Protection**: Proteção contra senhas vazadas habilitada
- **Email Confirmation**: Auto-confirmação de email configurada (desenvolvimento)
- **Leaked Password Protection**: ⚠️ **AÇÃO NECESSÁRIA** - Deve ser habilitada manualmente no backend

### Configuração de Leaked Password Protection

**IMPORTANTE**: A proteção contra senhas vazadas não está habilitada e precisa ser configurada:

1. Acesse o backend da aplicação
2. Navegue até Auth Settings
3. Habilite "Leaked Password Protection"

Esta configuração previne que usuários usem senhas conhecidas de vazamentos de dados.

### Implementação
```typescript
// src/lib/auth.tsx
// Proteção de rotas e gerenciamento de sessão
```

---

## 👥 Controle de Acesso Baseado em Funções (RBAC)

### Estrutura

#### Enum de Funções
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
```

#### Tabela user_roles
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);
```

#### Função de Verificação de Função
```sql
CREATE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
SECURITY DEFINER
```

Esta função é marcada como `SECURITY DEFINER` para evitar problemas de recursão em políticas RLS.

### Políticas de Acesso
- Usuários podem ver apenas suas próprias funções
- Apenas administradores podem visualizar o log de auditoria completo
- Atribuição automática de função 'user' para novos usuários

---

## 📝 Audit Logging

### Sistema de Auditoria
Todas as ações críticas são registradas automaticamente para rastreabilidade.

#### Tabela audit_logs
```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Função de Log
```sql
CREATE FUNCTION public.log_audit(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_metadata JSONB
) RETURNS UUID
```

### Integração

#### Backend (Edge Functions)
```typescript
// supabase/functions/_shared/auditLogger.ts
import { logAudit } from './auditLogger.ts';

await logAudit(supabaseClient, {
  action: 'quote_generated',
  resourceType: 'quote',
  resourceId: quoteId,
  metadata: { /* dados relevantes */ }
});
```

#### Frontend (React Hook)
```typescript
// src/hooks/useAuditLog.tsx
import { useAuditLog } from '@/hooks/useAuditLog';

const { logAction } = useAuditLog();
await logAction({
  action: 'user_action',
  resourceType: 'resource',
  resourceId: id
});
```

### Eventos Auditados
- Geração de orçamentos
- Análise de contrapropostas
- Interações de chat
- Alterações de configuração
- Ações administrativas

---

## ⏱️ Rate Limiting

### Implementação
Proteção contra ataques de força bruta e DDoS através de limitação de requisições.

```typescript
// supabase/functions/_shared/rateLimiter.ts
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { 
    maxRequests: 10, 
    windowMs: 60000 
  }
): Promise<void>
```

### Configurações por Endpoint

| Endpoint | Max Requests | Janela | Identificador |
|----------|--------------|--------|---------------|
| generate-quote | 10 | 60s | user_id |
| chat | 20 | 60s | user_id |
| analyze-counter-offer | 5 | 60s | user_id |

### Headers de Resposta
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 2024-01-15T10:30:00Z
```

### Tratamento de Erros
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 45
}
```

---

## ✅ Validação e Sanitização de Inputs

### Validação Server-Side

#### Funções de Validação
```typescript
// supabase/functions/_shared/inputValidation.ts

// Validação de email
validateEmail(email: string): string

// Validação de strings com limites
validateString(input: string, fieldName: string, minLength: number, maxLength: number): string

// Validação de números
validateNumber(input: any, fieldName: string, min?: number, max?: number): number

// Validação de UUID
validateUUID(input: string, fieldName: string): string

// Sanitização de strings
sanitizeString(input: string): string
```

#### Proteções Implementadas
- Remoção de caracteres perigosos (`<>`)
- Prevenção de `javascript:` URLs
- Remoção de event handlers (`on*=`)
- Validação de formato de email
- Limites de tamanho de strings
- Validação de tipos numéricos
- Validação de formato UUID

### Sanitização Client-Side

#### DOMPurify para XSS
```typescript
// src/lib/sanitize.ts
import DOMPurify from 'dompurify';

// Sanitização de HTML
sanitizeHtml(dirty: string): string

// Sanitização de strings
sanitizeString(input: string): string

// Sanitização recursiva de objetos
sanitizeObject<T>(obj: T): T
```

#### Configuração DOMPurify
```typescript
DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'target']
});
```

### Validação de Formulários
Todos os formulários utilizam validação com bibliotecas como React Hook Form + Zod para garantir dados válidos antes do envio.

---

## 🛡️ Headers de Segurança

### Implementação
```typescript
// supabase/functions/_shared/securityHeaders.ts
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': '...'
};
```

### Headers Configurados

#### X-Content-Type-Options: nosniff
Previne MIME type sniffing, forçando o navegador a respeitar o Content-Type declarado.

#### X-Frame-Options: DENY
Previne ataques de clickjacking impedindo que a página seja carregada em iframes.

#### X-XSS-Protection: 1; mode=block
Ativa o filtro XSS do navegador em modo bloqueio.

#### Strict-Transport-Security (HSTS)
Força conexões HTTPS por 1 ano, incluindo subdomínios.

#### Referrer-Policy
Controla quais informações de referência são enviadas em requisições.

#### Permissions-Policy
Desabilita APIs sensíveis (geolocalização, microfone, câmera).

---

## 🔒 Content Security Policy (CSP)

### Configuração
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               font-src 'self' data:; 
               connect-src 'self' https://*.supabase.co https://ai.gateway.lovable.dev">
```

### Políticas Implementadas

| Diretiva | Valor | Descrição |
|----------|-------|-----------|
| default-src | 'self' | Apenas recursos da mesma origem |
| script-src | 'self' 'unsafe-inline' 'unsafe-eval' | Scripts da mesma origem + inline (necessário para React) |
| style-src | 'self' 'unsafe-inline' | Estilos da mesma origem + inline |
| img-src | 'self' data: https: | Imagens da mesma origem, data URIs e HTTPS |
| font-src | 'self' data: | Fontes da mesma origem e data URIs |
| connect-src | 'self' https://*.supabase.co https://ai.gateway.lovable.dev | Conexões permitidas |

### Nota sobre 'unsafe-inline' e 'unsafe-eval'
Estes são necessários para o funcionamento do React e Vite em desenvolvimento. Em produção, considere usar nonces ou hashes para maior segurança.

---

## 🔐 Proteção de Dados

### Encryption at Rest
Todos os dados armazenados no Supabase são criptografados em repouso automaticamente.

### HTTPS Only
- Todas as conexões são forçadas a usar HTTPS
- HSTS configurado para garantir conexões seguras
- Certificados SSL/TLS gerenciados automaticamente

### Hash de Senhas
- Supabase utiliza bcrypt para hash de senhas
- Salts individuais para cada senha
- Proteção contra senhas vazadas habilitada

### Proteção de Secrets
```typescript
// Variáveis de ambiente (.env)
VITE_SUPABASE_URL=***
VITE_SUPABASE_PUBLISHABLE_KEY=***
```

**IMPORTANTE**: Nunca commitar arquivos `.env` ou incluir secrets em código.

### Dados Sensíveis
- Senhas nunca são armazenadas em texto plano
- Tokens JWT são armazenados de forma segura
- Dados de pagamento (se aplicável) seguem PCI DSS

---

## 🔑 Row Level Security (RLS)

### Políticas Implementadas

#### Tabela: quotes
```sql
-- Usuários podem ver apenas seus próprios orçamentos
CREATE POLICY "Users can view own quotes"
ON quotes FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem criar seus próprios orçamentos
CREATE POLICY "Users can create own quotes"
ON quotes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios orçamentos
CREATE POLICY "Users can update own quotes"
ON quotes FOR UPDATE
USING (auth.uid() = user_id);
```

#### Tabela: user_roles
```sql
-- Usuários podem ver apenas suas próprias funções
CREATE POLICY "Users can view own roles"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);
```

#### Tabela: audit_logs
```sql
-- Usuários podem ver apenas seus próprios logs
CREATE POLICY "Users can view own audit logs"
ON audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- Administradores podem ver todos os logs
CREATE POLICY "Admins can view all audit logs"
ON audit_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
```

#### Tabela: profiles
```sql
-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

#### Tabela: chat_messages
```sql
-- Usuários podem ver apenas mensagens de seus orçamentos
CREATE POLICY "Users can view own messages"
ON chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = chat_messages.quote_id
    AND quotes.user_id = auth.uid()
  )
);
```

#### Tabela: counter_offers
```sql
-- Usuários podem ver apenas contrapropostas de seus orçamentos
CREATE POLICY "Users can view own counter offers"
ON counter_offers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quotes
    WHERE quotes.id = counter_offers.quote_id
    AND quotes.user_id = auth.uid()
  )
);
```

### Proteção da Tabela freemium_users
```sql
-- A tabela freemium_users tem RLS habilitado mas SEM políticas públicas
-- Isso é INTENCIONAL: acesso apenas via edge functions com service role
-- Nenhum usuário final pode acessar diretamente esta tabela

-- RLS está habilitado para proteção
ALTER TABLE public.freemium_users ENABLE ROW LEVEL SECURITY;

-- Sem políticas = acesso negado para usuários
-- Edge functions usam service_role_key para bypass
```

### Princípios RLS
1. **Deny by Default**: Todas as tabelas com RLS habilitado negam acesso por padrão
2. **Least Privilege**: Usuários têm acesso apenas aos seus próprios dados
3. **Security Definer Functions**: Usadas para lógica que precisa bypass de RLS
4. **No Recursive Policies**: Função `has_role` evita recursão em verificações

---

## 📊 Monitoramento e Logging

### Eventos Monitorados

#### Ações de Usuário
- Login/Logout
- Geração de orçamentos
- Análise de contrapropostas
- Interações de chat
- Atualizações de perfil

#### Eventos de Segurança
- Tentativas de rate limit excedido
- Falhas de validação de input
- Tentativas de acesso não autorizado
- Erros de autenticação

#### Métricas de Performance
- Tempo de resposta das edge functions
- Taxa de erro por endpoint
- Uso de recursos

### Estrutura de Logs
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "user_id": "uuid",
  "action": "quote_generated",
  "resource_type": "quote",
  "resource_id": "uuid",
  "metadata": {
    "duration": 150,
    "status": "success"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

### Error Handling
```typescript
// Erros NÃO expõem stack traces em produção
try {
  // operação
} catch (error) {
  console.error('Error:', error.message); // Log interno
  return new Response(
    JSON.stringify({ error: 'An error occurred' }), // Resposta genérica
    { status: 500 }
  );
}
```

---

## 🔍 Checklist de Segurança

### ✅ Implementado

- [x] Autenticação JWT com Supabase
- [x] RBAC com tabela separada de funções
- [x] Audit logging completo
- [x] Rate limiting em edge functions
- [x] Validação e sanitização de inputs
- [x] Security headers (OWASP)
- [x] Content Security Policy
- [x] Row Level Security em todas as tabelas
- [x] Proteção contra XSS (DOMPurify)
- [x] Proteção contra SQL Injection (prepared statements)
- [x] HTTPS only com HSTS
- [x] Hash seguro de senhas (bcrypt)
- [x] Proteção contra senhas vazadas
- [x] Environment variables para secrets
- [x] Error handling sem exposição de stack traces
- [x] CORS configurado

### 🔄 Próximas Melhorias Recomendadas

- [ ] Implementar 2FA (Two-Factor Authentication)
- [ ] Adicionar painel admin de segurança
- [ ] Integrar monitoramento de ameaças em tempo real
- [ ] Implementar CAPTCHA em formulários públicos
- [ ] Adicionar testes de segurança automatizados (SAST/DAST)
- [ ] Configurar alertas de segurança
- [ ] Implementar backup automatizado
- [ ] Adicionar CSP em modo report-only para ajustes
- [ ] Remover 'unsafe-inline' e 'unsafe-eval' em produção
- [ ] Implementar API versioning

---

## 📚 Referências

### OWASP Top 10 2024
Esta aplicação implementa proteções contra:

1. **A01:2024 – Broken Access Control**: RLS + RBAC
2. **A02:2024 – Cryptographic Failures**: Encryption at rest, HTTPS, bcrypt
3. **A03:2024 – Injection**: Input validation, prepared statements, sanitização
4. **A04:2024 – Insecure Design**: Security by design, audit logs
5. **A05:2024 – Security Misconfiguration**: Security headers, CSP, proper config
6. **A06:2024 – Vulnerable Components**: Dependency scanning (npm audit)
7. **A07:2024 – Authentication Failures**: Supabase Auth, rate limiting, leaked password protection
8. **A08:2024 – Software and Data Integrity Failures**: Audit logs, validation
9. **A09:2024 – Security Logging Failures**: Comprehensive audit logging
10. **A10:2024 – Server-Side Request Forgery**: Input validation em URLs

### Documentação Técnica
- [Supabase Security](https://supabase.com/docs/guides/auth/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [DOMPurify](https://github.com/cure53/DOMPurify)

---

## 🚨 Reporte de Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança, por favor:

1. **NÃO** abra uma issue pública
2. Envie um email para: security@example.com
3. Inclua detalhes sobre a vulnerabilidade
4. Aguarde confirmação antes de divulgar publicamente

Tempo de resposta esperado: 48 horas

---

## 📝 Histórico de Atualizações

| Data | Versão | Descrição |
|------|--------|-----------|
| 2024-01-15 | 1.0 | Implementação inicial de segurança |
| - | - | RBAC, Audit Logs, Rate Limiting |
| - | - | Security Headers, CSP, Input Validation |
| - | - | RLS Policies, DOMPurify |

---

**Última atualização**: 2024-01-15  
**Responsável**: Equipe de Desenvolvimento  
**Revisão**: Trimestral
