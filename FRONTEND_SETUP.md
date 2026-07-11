# Frontend Setup Instructions

## Step 1: Install Dependencies

Run these commands in the `frontend` directory:

```bash
cd frontend

# Install router and HTTP client
npm install react-router-dom axios

# Install shadcn/ui and Radix UI components (optional, for advanced UI)
npm install @radix-ui/react-dialog @radix-ui/react-select class-variance-authority clsx tailwind-merge

# Install Lucide icons
npm install lucide-react
```

## Step 2: Environment Setup

Create `frontend/.env.local`:

```env
VITE_API_BASE=http://localhost:5000
```

## Step 3: Verify Installation

```bash
npm run dev
```

Should run on `http://localhost:5173`

## Project Structure Created

```
frontend/src/
├── context/
│   ├── ThemeContext.tsx       ✅ Light/Dark theme
│   ├── AuthContext.tsx        ✅ User auth state
│   └── PreferenceContext.tsx  ✅ User preferences
├── types/
│   └── index.ts               ✅ TypeScript types
├── App.tsx                    ✅ Router + Providers
├── main.tsx                   ✅ Entry point
└── index.css                  ✅ Theme variables
```

## Next Steps

1. Install dependencies (npm install commands above)
2. Create pages (Landing, Preferences, Dashboard)
3. Create components (Header, Hero, PreferenceForm)
4. Test theme switching and auth flow
