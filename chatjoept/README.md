# ChatJoePT 🤖

> **The Official ChatGPT Replica of the Joe Universe (`Joelib`)**  
> Deployed on Cloudflare Workers & Cloudflare KV with React Router v8, Tailwind CSS, and KaTeX.  
> **Production URL**: [https://chatjoept.waynexu2020.workers.dev](https://chatjoept.waynexu2020.workers.dev)

---

## 🌟 Highlights & Features

- **ChatGPT-Fidelity User Experience**:
  - Dark-mode interface adhering to modern ChatGPT UI design patterns.
  - Streaming Server-Sent Events (SSE) responses with token-by-token rendering.
  - Thought-process collapsible disclosures (`<think>...</think>`) labeled in Joeglish.
  - One-click copy for code blocks and assistant messages.
  - Web search mode toggle and file attachment processing.

- **Mathematical Formula Rendering (KaTeX)**:
  - Supports inline math (`$...$` and `\(...\)`) and display math (`$$...$$` and `\[...\]`).
  - Automatic pre-processing of brackets to ensure KaTeX parses mixed partial derivatives, fractions, matrices, and expressions accurately.
  - Horizontal overflow scrolling for long formulas.

- **Cross-Device Session Synchronization (Cloudflare KV)**:
  - Dialogs are persisted under `user:<email>:dialog:<id>` and indexed at `user:<email>:index`.
  - Conversations sync seamlessly across devices on login.
  - Safe data management: single-chat deletion and complete account erasure with storage reclamation.
  - Hard quotas enforced at the edge:
    - **Max 200 stored dialogs** per account.
    - **Max 16 MiB total storage** per account.

- **Rolling 24-Hour Usage Limit**:
  - Sliding 24-hour rate limiting stored in KV under `usage:<email>`.
  - Calculates real token cost based on upstream token consumption (cache hits, cache misses, output tokens).
  - Enforces a 2.00 CNY cap per rolling 24-hour window per account.

- **Quota Percentages in Settings**:
  - In accordance with privacy and security requirements, raw financial figures, dialog limits, and byte counts are never exposed to the client.
  - The Settings modal renders visual capacity progress meters displayed exclusively as percentages:
    - **24h Usage Quota (%)**
    - **Dialog Capacity (%)**
    - **Storage Used (%)**

- **Public Dialog Sharing (`/share/:shareId`)**:
  - Instant public sharing links accessible without authentication.
  - Responsive multi-round thread view with sticky header and full vertical scrolling.
  - Automatic synchronization: subsequent conversation rounds automatically sync to existing share IDs.

- **Secure OTP Authentication & Provider Masking**:
  - Passwordless Email OTP login restricted to authorized domains (`united-taylors.org`, `sstx.org`, `hamdenhall.org`) delivered via Resend.
  - Signed HMAC session tokens with 30-day persistence.
  - Strict provider concealment: upstream model identities and endpoints are completely abstracted behind the ChatJoePT persona and JPT models (`JPT-6.1 Sol`, `JPT-6.1 Terra`).

---

## 🏗️ Architecture & Tech Stack

```
chatjoept/
├── app/
│   ├── components/            # UI Components
│   │   ├── ChatInput.tsx      # Multi-line textarea, file uploads, web search toggle
│   │   ├── ChatMessage.tsx    # Message cards, thoughts, copy buttons, avatars
│   │   ├── MarkdownRenderer.tsx # ReactMarkdown + RemarkMath + RehypeKatex
│   │   ├── ModelSelector.tsx  # JPT model switcher dropdown
│   │   ├── SettingsModal.tsx  # Usage % meters, account data management
│   │   ├── ShareModal.tsx     # Public share link generator & copy tool
│   │   └── Sidebar.tsx        # Conversation drawer, search, user menu
│   ├── routes/                # React Router v8 Route Modules
│   │   ├── home.tsx           # Primary chat application interface
│   │   ├── login.tsx          # Email OTP authentication page
│   │   ├── share.$shareId.tsx # Public shared conversation view
│   │   ├── api.auth.*.ts      # OTP dispatch and verification endpoints
│   │   ├── api.chat.ts        # SSE streaming LLM proxy & 24h quota enforcement
│   │   ├── api.dialogs.ts     # Dialog CRUD & storage quota tracking
│   │   └── api.dialogs.share.ts # Public share management
│   ├── utils/
│   │   ├── auth.server.ts     # HMAC token signing, domain validation, Resend OTP
│   │   └── kv.ts              # Cloudflare KV client, 24h usage, session sync
│   ├── app.css                # Tailwind CSS v4 + KaTeX stylesheets
│   └── root.tsx               # Root document layout & error boundaries
├── workers/
│   └── app.ts                 # Cloudflare Worker request handler entrypoint
├── wrangler.jsonc             # Cloudflare Worker & KV namespace configuration
└── package.json
```

---

## ⚙️ Environment Variables & Bindings

### 1. Cloudflare KV Binding
Configured in `wrangler.jsonc`:
```jsonc
"kv_namespaces": [
  {
    "binding": "CHATJOEPT_KV",
    "id": "d87c99907ebc4fc0b58e538e62fd6c1d"
  }
]
```

### 2. Environment Variables & Secrets

| Variable | Type | Description |
|---|---|---|
| `ALLOWED_EMAIL_DOMAINS` | Var | Comma-separated domains allowed to log in (e.g. `united-taylors.org,sstx.org,hamdenhall.org`) |
| `RESEND_FROM_EMAIL` | Var | Sender address for OTP emails (e.g. `ChatJoePT <chatjoept-noreply@united-taylors.org>`) |
| `LLM_API_URL` | Var | Base URL of upstream LLM API (e.g. `https://api.deepseek.com`) |
| `LLM_BASE_MODEL` | Var | Default model identifier (e.g. `deepseek-chat`) |
| `LLM_API_KEY` | Secret | API key for upstream LLM provider |
| `RESEND_API_KEY` | Secret | API key for Resend email dispatch |
| `SESSION_SECRET` | Secret | Cryptographic salt for HMAC session token signing |

Secrets can be set in Cloudflare via the dashboard or using Wrangler:
```bash
npx wrangler secret put LLM_API_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put SESSION_SECRET
```

For local development, define them in `.dev.vars`:
```ini
LLM_API_KEY="your-api-key"
RESEND_API_KEY="re_your_resend_key"
SESSION_SECRET="your-local-dev-secret"
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Accessible at `http://127.0.0.1:8787` (or preview at `http://localhost:5173`).

### 3. Type Checking & Verification
```bash
npm run typecheck
```

### 4. Build for Production
```bash
npm run build
```

### 5. Deploy to Cloudflare Workers
```bash
npm run deploy
```

---

## 🧪 Testing & Verification Scripts

Standalone test scripts are maintained in `scratch/`:
- **`scratch/verify_sharing.mjs`**: End-to-end verification of multi-round chat creation, public share generation, DOM message presence, automatic multi-round sync, and CSS scroll verification.

Run verification:
```bash
node scratch/verify_sharing.mjs
```

---

## 📜 License & Attribution

Part of the **[Joelib](https://github.com/Histar4522/Joelib)** project.  
Created for the **United Taylors Joe Universe**.
