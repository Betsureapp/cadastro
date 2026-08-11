# 🐴 NCCMMGR - Sistema de Gestão de Associados

Sistema de cadastro e gestão de associados do **Núcleo dos Criadores de Cavalos Mangalarga Marchador de Guanambi e Região**.

## 📋 Funcionalidades

- **Formulário Público de Cadastro**: Captura completa de dados de novos associados
- **Sistema de Indicações**: Links personalizados com rastreamento de cliques e conversões
- **Pipeline Kanban**: Visualização drag-and-drop do funil de aprovação
- **Dashboard**: Métricas e estatísticas em tempo real
- **Gestão de Associados**: Lista completa com filtros e busca
- **Relatório de Indicações**: Ranking dos promotores e taxas de conversão

## 🎨 Design

- Design inspirado em **Kumo UI / Cloudflare**
- Tema escuro com cores laranja (#f6821f)
- Fonte: Inter
- 100% responsivo

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Estilização**: CSS Modules + CSS Variables
- **Estado**: Zustand
- **Banco de Dados**: Supabase
- **Drag & Drop**: @dnd-kit

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Criar arquivo de ambiente
cp .env.local.example .env.local
# Edite o .env.local com suas credenciais do Supabase

# Executar em modo desenvolvimento
npm run dev
```

## 🔧 Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o SQL do arquivo `supabase-schema.sql` no SQL Editor
3. Copie a URL e a chave anônima do projeto
4. Cole no `.env.local`

### Estrutura do Banco

- `associates` - Cadastros de associados/candidatos
- `profiles` - Perfis de usuário (ligados ao auth)
- `referral_codes` - Códigos de indicação
- `status_history` - Histórico de mudanças de status
- `referral_clicks` - Rastreamento de cliques

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx              # Login
│   ├── cadastro/             # Formulário público
│   └── admin/               # Painel administrativo
│       ├── pipeline/        # Kanban
│       ├── associados/       # Lista de associados
│       ├── indicacoes/       # Relatório de indicações
│       └── configuracoes/    # Configurações
├── components/
│   ├── ui/                  # Componentes base
│   └── admin/               # Layout admin
├── lib/
│   ├── supabase.ts          # Cliente Supabase
│   └── utils.ts             # Utilitários
└── store/
    └── index.ts             # Zustand stores
```

## 🔐 Segurança

- Row Level Security (RLS) em todas as tabelas
- Administradores veem todos os dados
- Usuários veem apenas seus próprios dados
- Validação de CPF
- Webhooks para automação

## 📝 Licença

MIT
