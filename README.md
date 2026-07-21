# Live Leaderboard

A modern, responsive leaderboard landing page powered by real-time API data. Built with Next.js App Router, TypeScript, and Tailwind CSS.

## Technology Stack

- **Next.js** — App Router, Server Components, API Routes
- **TypeScript** — Strict typing throughout
- **Tailwind CSS** — Utility-first styling
- **Zod** — API response validation
- **Lucide React** — Lightweight icons
- **clsx + tailwind-merge** — Class name management

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your leaderboard API URL:

```env
LEADERBOARD_API_URL=https://your-api-url.com/leaderboard
```

If the API requires an API key, also add:

```env
LEADERBOARD_API_KEY=your_api_key_here
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Lint

```bash
npm run lint
```

### 5. Production build

```bash
npm run build
```

### 6. Start production server

```bash
npm run start
```

## API Security

The private leaderboard API URL and any API keys are stored in server-only environment variables (`.env.local`). These variables are **never** prefixed with `NEXT_PUBLIC_`, so they remain server-side only.

A secure server-side API route (`/api/leaderboard`) fetches the external API, validates and normalizes the response, and returns only the required data to the frontend. The private API URL and credentials are never exposed to the browser.

## Project Structure

```
src/
├── app/
│   ├── api/leaderboard/route.ts   # Secure server-side API route
│   ├── globals.css                # Global styles and theme variables
│   ├── layout.tsx                 # Root layout with metadata
│   ├── loading.tsx                # Loading page shell
│   ├── error.tsx                  # Error boundary
│   └── page.tsx                   # Main landing page
├── components/
│   ├── navbar.tsx                 # Sticky navigation bar
│   ├── hero-section.tsx           # Hero section
│   ├── leaderboard-section.tsx    # Main leaderboard container
│   ├── leaderboard-stats.tsx      # Statistics cards
│   ├── top-three-podium.tsx       # Top 3 podium display
│   ├── leaderboard-table.tsx      # Responsive leaderboard rows
│   ├── leaderboard-filters.tsx    # Search, sort, and filter controls
│   ├── how-it-works.tsx           # Three-step explanation
│   ├── footer.tsx                 # Site footer
│   ├── loading-skeleton.tsx       # Skeleton loading states
│   ├── error-state.tsx            # Error display with retry
│   └── empty-state.tsx            # Empty leaderboard state
├── hooks/
│   └── use-leaderboard.ts         # Data fetching and auto-refresh hook
├── lib/
│   ├── leaderboard-api.ts         # API client utilities
│   ├── leaderboard-schema.ts      # Zod validation schemas
│   ├── normalize-leaderboard.ts   # API response normalization
│   ├── formatters.ts              # Number and date formatting
│   └── utils.ts                   # Shared utilities (cn, debounce)
└── types/
    └── leaderboard.ts             # TypeScript type definitions
```

## Troubleshooting

- **"Leaderboard service is not configured."** — Make sure `LEADERBOARD_API_URL` is set in `.env.local`.
- **Build fails with TypeScript errors** — Run `npm run lint` to check for issues.
- **No users appear** — Verify the API is returning data and that the URL is correct.
- **API errors** — Check the server logs for details (the error messages shown to users are generic for security).

## Features

- Real-time leaderboard with automatic 60-second refresh
- Client-side search by user name
- Sort by rank or score
- Pagination (Load More)
- Responsive design (mobile, tablet, desktop)
- Loading skeletons
- Error states with retry
- Empty state display
- Reduced-motion support
- Keyboard accessible
