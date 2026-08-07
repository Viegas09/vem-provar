# Vem Provar

Portal de gastronomia e delivery para Itapecerica da Serra — o "iFood da cidade".

## Stack

- [React](https://react.dev/) + [Vite](https://vite.dev/)
- [React Router](https://reactrouter.com/) para navegação
- [Tailwind CSS](https://tailwindcss.com/)
- [lucide-react](https://lucide.dev/) para ícones
- [Supabase](https://supabase.com/) (banco de dados + backend)

## Configurando o Supabase (necessário)

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e um novo projeto.
2. No projeto, vá em **SQL Editor → New query**, cole o conteúdo de `supabase-schema.sql` (na raiz deste projeto) e clique em **Run**. Isso cria as tabelas e já popula com os 4 restaurantes de exemplo.
3. Vá em **Project Settings → API** e copie a **Project URL** e a **anon public key**.
4. Copie `.env.example` para `.env` e preencha com esses dois valores:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-aqui
   ```
5. Se for publicar no Vercel, adicione essas mesmas duas variáveis em **Project Settings → Environment Variables** no painel do Vercel.

## Rodando localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
```

## Estrutura

- `src/pages/` — páginas (Home, Restaurant, Cart, Checkout, OrderConfirmation)
- `src/data/queries.js` — chamadas ao Supabase
- `src/hooks/` — hooks de carregamento de dados (restaurantes)
- `src/context/CartContext.jsx` — estado do carrinho (persistido no navegador)
- `src/assets/` — logotipo e ícone da marca Vem Provar
- `supabase-schema.sql` — script para criar as tabelas no Supabase
