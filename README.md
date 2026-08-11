# 🐴 NCCMMGR - Sistema de Gestão de Associados

Sistema de cadastro e gestão de associados do **Núcleo dos Criadores de Cavalos Mangalarga Marchador de Guanambi e Região**.

## 📋 Funcionalidades

- ✅ **Formulário Público de Cadastro** em etapas (Typeform-style)
- ✅ **Cadastro aprovado automaticamente**
- ✅ **Login admin** com Supabase Auth
- ✅ **Dashboard** com estatísticas
- ✅ **Pipeline em formato Carrossel** (Aprovados / Cancelados)
- ✅ **Links de Indicação** personalizados por associado
- ✅ **Máscaras** de CPF, Telefone, CEP
- ✅ **100% responsivo** (mobile-first)
- ✅ **Tema claro** com fonte Inter

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Estilização**: CSS Modules + CSS Variables
- **Banco de Dados**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Icons**: Lucide React

## 📦 Estrutura

```
src/
├── app/
│   ├── page.tsx                # Login admin
│   ├── cadastro/               # Formulário público (etapas)
│   └── admin/
│       ├── page.tsx           # Dashboard
│       ├── pipeline/          # Carrossel de associados
│       ├── associados/         # Lista detalhada
│       ├── indicacoes/         # Links de indicação
│       └── configuracoes/      # Gerenciar admins
├── components/
│   ├── ui/                    # Componentes base (Button, Input, etc)
│   └── admin/                 # Layout admin (Sidebar, Header)
└── lib/
    ├── supabase.ts            # Cliente Supabase
    └── utils.ts               # Utilitários
```

---

## 🟢 Deploy na Vercel

### 1. Conectar ao GitHub

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em **"Add New Project"**
4. Selecione o repositório **Betsureapp/cadastro**
5. Clique em **"Import"**

### 2. Configurar Variáveis de Ambiente

Na tela de configuração da Vercel, adicione:

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fkpgvodxnbqrmtcxeijw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrcGd2b2R4bmJxcm10Y3hlaWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MjQyMjcsImV4cCI6MjEwMjAwMDIyN30.tx4Ry36kRl08huXgBdPnb5oOWQLyh4seRUiffU3rb_E` |

### 3. Deploy

1. Clique em **"Deploy"**
2. Aguarde ~2 minutos
3. Pronto! 🎉

### 4. Domínio

A Vercel gera um domínio `https://cadastro.vercel.app`. Você pode configurar domínio personalizado depois.

---

## 🔧 Configuração Inicial do Supabase

Execute os arquivos SQL no **Supabase Dashboard > SQL Editor**:

1. **`supabase-schema.sql`** - Schema completo (tabelas, policies, triggers)
2. **`supabase-setup.sql`** - Tabelas básicas
3. **`supabase-fix.sql`** - Ajustes de status default

### Criar Admin

1. Acesse **Authentication** → **Users** → **Add User**
2. Cadastre e-mail e senha
3. Anote o **UUID**
4. Execute:
```sql
INSERT INTO public.profiles (id, role, full_name)
VALUES ('SEU-UUID-AQUI', 'admin', 'Administrador');
```

---

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Variáveis de ambiente
cp .env.local.example .env.local

# Editar .env.local com suas credenciais

# Rodar dev server
npm run dev
```

Acesse:
- `http://localhost:3000` → Login admin
- `http://localhost:3000/cadastro` → Formulário público

---

## 📝 Licença

MIT