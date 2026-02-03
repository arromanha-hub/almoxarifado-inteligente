<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` in [.env.local](.env.local)
3. Run the app:
   `npm run dev`

## Deploy na Vercel

Para hospedar esta aplicação na Vercel:

1. **Importe o projeto** no dashboard da Vercel através do GitHub.
2. **Configurações do Projeto:**
   - **Root Directory:** `almoxarifado-inteligente` (selecione a pasta onde está o código-fonte).
   - **Framework Preset:** Vite.
   - **Build Command:** `npm run build`.
   - **Output Directory:** `dist`.
3. **Variáveis de Ambiente:** Adicione as seguintes chaves:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Pronto!** A Vercel cuidará do build e deploy automaticamente, e o arquivo `vercel.json` garantirá que o roteamento SPA funcione corretamente.
