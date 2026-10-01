# iFindz — Sistema Profissional de Gestão Apple & Catálogo Oficial

Sistema web completo desenvolvido para a **iFindz**, loja especializada em produtos Apple. O sistema opera como um painel administrativo de alta precisão para cadastro, organização, cotação, importação/exportação e consulta de produtos e preços, além de fornecer um catálogo público oficial e minimalista inspirado no padrão visual da Apple.

---

## 🌟 Regras Fundamentais do Sistema

1. **Separação Estrita de Fontes de Preço:**
   - **Preço do Dia (`PRECO_DO_DIA`):** Fonte oficial de dados para o catálogo público.
   - **Preço Loja Física (`LOJA_FISICA`):** Área 100% isolada para atendimento de balcão e loja física. Nunca misturado com o Preço do Dia e nunca utilizado para alimentar o catálogo online.
2. **Regra Especial dos iPhones:**
   - Todo iPhone marcado como `NOVO_LACRADO` com fonte `PRECO_DO_DIA` recebe **automaticamente uma margem de +R$ 200,00** sobre o preço de custo/original do fornecedor.
   - Exemplo: Custo Fornecedor R$ 7.550,00 ➔ Preço no Sistema R$ 7.750,00.
3. **Não Aplicação nos Seminovos:**
   - Produtos seminovos (`SEMINOVO`) **nunca recebem os +R$ 200,00** e **jamais aparecem no catálogo público do Preço do Dia**.
4. **Não Aplicação nos Demais Produtos:**
   - iPads, MacBooks, Apple Watch, AirPods e Acessórios **não recebem a margem automática de R$ 200,00**. Utilizam seu preço original cadastrado + margem configurada pelo administrador.
5. **Garantia Contra Acúmulo de Margem:**
   - Fórmula: `preço_final = preço_original + margem`. Se o preço original for alterado de 7.550 para 7.600, o novo preço final será exatamente 7.800 (nunca 7.750 + 200 = 7.950).
6. **Histórico e Rastreabilidade Completa:**
   - Toda alteração de preço grava automaticamente um registro em `PriceHistory` com o preço anterior, novo preço, margem, usuário responsável, data/hora e justificativa.

---

## 🛠 Tecnologias Utilizadas

- **Framework:** Next.js 14 (App Router com TypeScript)
- **Estilização:** Tailwind CSS (tema Apple minimalista, fontes SF Pro, paleta em tons de branco, cinza e preto com acentos discretos)
- **Banco de Dados & ORM:** SQLite com Prisma ORM (portável, estável e autônomo)
- **Autenticação:** Criptografia bcrypt para senhas e JWT seguro com cookies HTTP-only
- **Manipulação de Arquivos:** Suporte nativo para planilhas Excel (.xlsx, .xls), CSV e JSON com biblioteca `xlsx`
- **Ícones:** Lucide React

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos
- Node.js 18+ (testado no Node v20)
- npm 9+

### 2. Instalar dependências
```bash
npm install
```

### 3. Inicializar e popular o Banco de Dados
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

### 4. Executar os 10 Testes Automatizados Obrigatórios
```bash
npm run test:rules
```

### 5. Iniciar o Servidor de Desenvolvimento ou Produção
```bash
# Modo desenvolvimento:
npm run dev

# Modo produção:
npm run build
npm run start
```
O sistema estará disponível em: **`http://localhost:3000`**

---

## 🔐 Acesso Administrativo

- **URL de Login:** `/login`
- **Painel Administrativo:** `/admin/dashboard`
- **E-mail padrão:** `admin@ifindz.com.br`
- **Senha padrão:** `admin123`

---

## 📂 Estrutura de Rotas e Páginas

| Rota | Descrição |
|---|---|
| `/` | Catálogo Público Oficial (apenas `PRECO_DO_DIA` + `NOVO_LACRADO` ativos) |
| `/catalogo` | Alias direto para o Catálogo Público |
| `/login` | Tela de autenticação com validação segura |
| `/admin/dashboard` | Métricas gerais, totalizadores, cotações recentes e KPIs |
| `/admin/preco-do-dia` | Gestão de preços do catálogo com filtros avançados e exportação |
| `/admin/preco-loja-fisica`| Gestão isolada de preços de balcão da loja física |
| `/admin/produtos` | Inventário completo de produtos com ações de edição e duplicação |
| `/admin/categorias` | Gestão dinâmica de categorias e subcategorias Apple |
| `/admin/importar` | Importação em lote (CSV, Excel, JSON) com pré-visualização de margens |
| `/admin/configuracoes` | Ajuste da margem de iPhone, modo de arredondamento e WhatsApp |
| `/admin/usuarios` | Criação e gestão de contas administrativas |
| `/admin/logs` | Histórico cronológico de preços e logs de auditoria |

---

## 📡 Endpoints da API REST

- `GET /api/catalog/preco-do-dia`: Retorna exclusivamente produtos elegíveis para o catálogo oficial.
- `GET /api/products`: Lista produtos com filtros (`source`, `condition`, `category`, `search`, etc.).
- `POST /api/products`: Cadastro de novo produto com recálculo automático de margem e auditoria.
- `PUT /api/products/:id`: Atualização com recálculo automático sem acúmulo de margem e registro em histórico.
- `DELETE /api/products/:id`: Remoção de produto.
- `POST /api/products/:id/duplicate`: Duplicação rápida de produto.
- `POST /api/import/preview`: Processa arquivo CSV/XLSX/JSON e devolve pré-visualização com cálculo de margens.
- `POST /api/import/commit`: Salva os produtos pré-visualizados no banco.
- `GET /api/export?format=xlsx|csv|json`: Exporta exclusivamente produtos elegíveis (`PRECO_DO_DIA` + `NOVO_LACRADO`) com preço final já calculado.
- `GET /api/history`: Histórico de alterações de preços.
- `GET /api/dashboard`: Métricas executivas em tempo real.
- `POST /api/auth/login`: Autenticação e geração de cookie HTTP-only.
- `POST /api/auth/logout`: Encerramento seguro de sessão.

---

## ✅ Verificação dos 10 Cenários Obrigatórios

O script automatizado `npm run test:rules` valida com precisão matemática:

1. **iPhone novo no Preço do Dia:** Recebe margem de +R$ 200,00 (`7.550 + 200 = 7.750`).
2. **iPhone seminovo:** Não recebe margem de R$ 200,00 e é bloqueado do catálogo público.
3. **iPad novo no Preço do Dia:** Aparece no catálogo sem os +R$ 200,00 (`4.100`).
4. **MacBook novo:** Aparece conforme preço configurado sem os +R$ 200,00 (`7.990`).
5. **Seminovo de qualquer categoria:** Bloqueado do catálogo público.
6. **Produto da Loja Física:** Bloqueado do catálogo do Preço do Dia e sem +R$ 200,00.
7. **Alteração de preço original:** Recalcula automaticamente o preço final (`7.550 ➔ 7.600` gera `7.800`).
8. **Não duplicação de margem:** O preço final nunca acumula margem anterior (`7.800`, e não `7.950`).
9. **Exportação oficial:** Gera arquivos contendo estritamente produtos `PRECO_DO_DIA` + `NOVO_LACRADO`.
10. **API pública do catálogo:** Retorna estritamente produtos autorizados.
