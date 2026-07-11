# 🖤 Blackwork Tattoo Preview AI

Web app que gera designs de tatuagem **blackwork** (100% tinta preta, sem cor) com IA — e deixa o cliente **se ver tatuado** antes de fechar o serviço.

Dois modos:

- **Gerar do zero** — descreva a tatuagem e receba um design flash-sheet.
- **Ver-se tatuado** — envie uma foto sua e a IA compõe a tatuagem na sua pele, seguindo o contorno do corpo.

Stack: **Next.js 14 (App Router)** + **TypeScript** + **Tailwind CSS**. Roda em `localhost:3000`.
Geração via modelo `gpt-image-1` da [OpenAI](https://platform.openai.com) (endpoints `images/generations` e `images/edits`).

> Este projeto foi construído com o **[AIOX](https://github.com/Synkra/AIOX)** — um framework open source de orquestração de agentes de IA para desenvolvimento full stack. A seção [**Continuar a execução no AIOX**](#-continuar-a-execução-no-aiox) mostra como evoluir este MVP usando os agentes.

---

## 🚀 Rodar o app (qualquer dev)

### Pré-requisitos

- Node.js 18+ (testado com Node 20)
- npm
- Uma chave da OpenAI com créditos e acesso ao `gpt-image-1`

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/fefsbenson/tattoo-preview-ai.git
cd tattoo-preview-ai

# 2. Instale as dependências
npm install

# 3. Configure sua chave da OpenAI
cp .env.local.example .env.local
# edite .env.local e preencha:
#   OPENAI_API_KEY=sua-chave-aqui

# 4. Suba o servidor
npm run dev
```

Abra **[http://localhost:3000](http://localhost:3000)**.

> Obtenha sua chave em https://platform.openai.com/api-keys — a conta precisa de créditos e acesso ao `gpt-image-1`.
> Ao alterar `.env.local`, reinicie o `npm run dev` para recarregar a chave.

---

## 🤖 Continuar a execução no AIOX

Este MVP nasceu de uma orquestração de agentes do **AIOX open source**. Se você tem o AIOX instalado, pode clonar este repositório para dentro do seu ambiente e continuar evoluindo o app com os mesmos agentes que o criaram — sem começar do zero.

### 1. Instale o AIOX (se ainda não tiver)

Siga o guia oficial do [AIOX open source](https://github.com/Synkra/AIOX). Em resumo:

```bash
npx aiox-init
# ou consulte o README do AIOX para a instalação recomendada
```

### 2. Traga este MVP para o seu workspace

Clone o repositório para uma pasta dentro (ou ao lado) do seu projeto AIOX:

```bash
git clone https://github.com/fefsbenson/tattoo-preview-ai.git
cd tattoo-preview-ai
npm install
cp .env.local.example .env.local   # preencha OPENAI_API_KEY
```

### 3. Continue a execução com os agentes

Abra o Claude Code no diretório do projeto e ative os agentes do AIOX para evoluir o MVP. Exemplos de como retomar a execução:

| Objetivo | Agente | Como pedir |
| --- | --- | --- |
| Implementar uma nova feature | `@dev` (Dex) | `@dev adicione um seletor de estilo (fine-line, dotwork, tribal) ao formulário` |
| Testar e validar em runtime | `@qa` (Quinn) | `@qa valide os dois fluxos em localhost e reporte um gate PASS/FAIL` |
| Desenhar uma mudança de arquitetura | `@architect` (Aria) | `@architect projete a persistência de histórico de designs por sessão` |
| Subir para o GitHub / deploy | `@devops` (Gage) | `@devops crie um PR e configure deploy na Vercel` |
| Revisar qualidade / segurança | `@qa` | `@qa rode uma revisão de segurança na rota /api/generate` |

> **Fluxo recomendado (Story Development Cycle):** `@sm *draft` → `@po *validate` → `@dev *develop-story` → `@qa *qa-gate` → `@devops *push`.
> Para uma tarefa rápida, basta chamar `@dev` direto no modo autônomo.

### Ideias de próximas execuções

- 🎨 Seletor de sub-estilos blackwork (dotwork, ornamental, geométrico, tribal)
- 💾 Histórico de designs por sessão (o AIOX pode plugar Supabase)
- 📐 Escolha do tamanho/local do corpo com presets
- 🖼️ Galeria de exemplos e "regenerar variação"
- 💸 Toggle de qualidade (`low`/`medium`/`high`) para controlar custo por imagem
- 🌐 Deploy público na Vercel para o cliente do estúdio acessar de fora

---

## ⚠️ Sem a chave configurada

O app carrega normalmente até o momento da geração. Se `OPENAI_API_KEY`
estiver vazia, a API responde com erro claro (HTTP 503) e a interface mostra:

> "A chave da IA não está configurada. Adicione OPENAI_API_KEY ao arquivo .env.local e reinicie o servidor."

Se a chave for inválida ou a conta estiver sem créditos (HTTP 402), o app
mostra mensagens específicas orientando a correção. Nenhuma chave ou detalhe
interno é exposto ao navegador.

---

## 📜 Scripts

| Comando             | Descrição                        |
| ------------------- | -------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento      |
| `npm run build`     | Build de produção                |
| `npm run start`     | Servir o build de produção       |
| `npm run lint`      | Checagem de lint (ESLint / Next) |
| `npm run typecheck` | Checagem de tipos (TypeScript)   |

---

## 🏗️ Arquitetura

```
app/
├── layout.tsx            # Tema dark blackwork
├── globals.css
├── page.tsx              # Single page (client component), estado em useState
├── api/generate/route.ts # ÚNICO ponto que lê a OPENAI_API_KEY
├── components/
│   ├── ModeToggle.tsx    # Alterna entre os dois modos
│   ├── GenerateForm.tsx  # Descrição (modo "gerar do zero")
│   ├── TryOnForm.tsx     # Upload de foto + descrição (modo "ver-se tatuado")
│   ├── ResultCanvas.tsx  # Exibe o resultado + botão de download
│   └── ErrorBanner.tsx   # Mensagens de erro em PT-BR
└── lib/
    ├── openai.ts         # Integração server-only com OpenAI (generations + edits)
    ├── prompts.ts        # System prompt + prompts de cada modo
    ├── types.ts          # Contrato da API (tipos + mapa de erros)
    ├── validation.ts     # Validação de mode/prompt/imagem
    └── imageUtils.ts     # File→dataURL, downscale (canvas), download
```

### Contrato da API `/api/generate` (POST)

**Request (JSON, base64 — sem multipart):**

- `{ mode: "generate", prompt }` — `prompt` entre 3 e 600 caracteres
- `{ mode: "tryon", prompt, image }` — `image` = `"data:image/jpeg;base64,..."`

**Response:**

- `200`: `{ ok: true, mode, image: "data:image/png;base64,...", textNote }`
- erro: `{ ok: false, error: { code, message (PT-BR), status } }`

**Códigos de erro → HTTP:**

| Código                 | HTTP |
| ---------------------- | ---- |
| `MISSING_API_KEY`      | 503  |
| `INVALID_API_KEY`      | 503  |
| `INSUFFICIENT_CREDITS` | 402  |
| `INVALID_MODE`         | 400  |
| `INVALID_PROMPT`       | 400  |
| `INVALID_IMAGE`        | 400  |
| `IMAGE_TOO_LARGE`      | 413  |
| `RATE_LIMITED`         | 429  |
| `NO_IMAGE_RETURNED`    | 502  |
| `UPSTREAM_ERROR`       | 502  |
| `TIMEOUT`              | 504  |

---

## 📝 Notas

- **Sem login e sem persistência** — as imagens não são armazenadas no servidor.
- Fotos são reduzidas no navegador (máx. 1024px no maior lado, JPEG q0.85) antes
  do envio, para manter o payload leve e abaixo do limite de 5 MB.
- A tatuagem em foto é uma **prévia aproximada — não é o resultado final**.
- **Custo:** cada geração consome créditos da sua conta OpenAI (`gpt-image-1`,
  ~US$ 0,04–0,07/imagem em qualidade `medium`). Ajuste `quality` em `lib/openai.ts`
  para controlar custo.
- **Segurança:** nunca commite `.env.local`. A chave só é lida server-side em
  `api/generate/route.ts` — nunca chega ao navegador.

---

*Construído com [AIOX](https://github.com/Synkra/AIOX) 🤖 · Orquestração de agentes de IA para full stack.*
