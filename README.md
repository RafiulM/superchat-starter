# Auth Dashboard Starter Kit

A modern Next.js 15 starter kit with complete authentication flow and protected dashboard. Perfect foundation for web applications that require user sign-up/sign-in and a gated dashboard area.

## ✨ What's Included

- 🔐 **Complete Authentication**: User sign-up and sign-in with secure password handling
- 🏠 **Protected Dashboard**: Gated dashboard area accessible only after authentication
- 🎨 **Modern UI**: Beautiful components with dark mode support
- 📱 **Responsive Design**: Mobile-first design that works on all devices
- ⚡ **Type Safe**: Full TypeScript support with strict mode
- 🚀 **Production Ready**: Optimized build configuration and deployment setup

## 🛠 Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** TypeScript (strict mode)
- **Authentication:** [Better Auth](https://better-auth.com/)
- **Database:** [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (40+ components)
- **Theme:** Dark/light mode with [next-themes](https://github.com/pacocoursey/next-themes)
- **Icons:** [Lucide React](https://lucide.dev/)

## 🚀 Quick Start

Get your authentication dashboard running in minutes:

### 1. Clone & Install
```bash
git clone <repository-url>
cd codeguide-starter-fullstack
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Default values work with Docker - no changes needed!
```

### 3. Start Development
```bash
# Start database (Docker required)
npm run db:up

# Setup database schema
npm run db:push

# Start development server
npm run dev
```

### 4. View Your App
Open [http://localhost:3000](http://localhost:3000) to see:
- Landing page with sign-up/sign-in options
- Authentication flow with secure password handling
- Protected dashboard after successful login

**No database setup required** - Docker handles everything automatically!

## ⚙️ Configuration

### Environment Variables
Copy `.env.example` to `.env` - the defaults work perfectly with Docker:

```env
# Database (Docker defaults - ready to use!)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/postgres

# Authentication (generate your own secret for production)
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

### Database Options

**🐳 Docker (Recommended)**
```bash
npm run db:up    # Start PostgreSQL container
npm run db:push  # Setup database schema
```

**🏠 Local PostgreSQL**
```bash
# Update DATABASE_URL in .env to your local database
npm run db:push  # Setup schema
```

## 🏗 Project Structure

```
codeguide-starter-fullstack/
├── app/
│   ├── sign-up/              # User registration page
│   ├── sign-in/              # User login page
│   ├── dashboard/            # Protected dashboard area
│   ├── globals.css           # Global styles
│   └── layout.tsx           # Root layout
├── components/
│   └── ui/                   # shadcn/ui components (40+)
├── lib/
│   ├── auth.ts              # Authentication config
│   └── utils.ts             # Utility functions
├── db/
│   ├── index.ts             # Database connection
│   └── schema.ts            # Database schemas
├── docker-compose.yml       # Docker services
└── drizzle.config.ts        # Drizzle ORM config
```

## 🎯 User Flow

1. **Landing Page** → Choose Sign Up or Sign In
2. **Sign Up** → Create account with email/password
3. **Sign In** → Login with existing credentials
4. **Dashboard** → Access protected area after authentication
5. **Session** → Secure session management with automatic redirects

## 🛠 Development Commands

### Application
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

### Database
```bash
npm run db:up      # Start PostgreSQL (Docker)
npm run db:down    # Stop PostgreSQL
npm run db:push    # Apply schema changes
npm run db:studio  # Open database GUI
npm run db:reset   # Reset database
```

### Docker
```bash
npm run docker:up    # Start full stack (app + database)
npm run docker:down  # Stop all containers
npm run docker:logs  # View container logs
```

### UI Components
- **40+ shadcn/ui components** pre-installed
- **Dark/light mode** with system detection
- **Add components**: `npx shadcn@latest add [component-name]`

## 🚀 Deployment

### Production Setup

**1. Environment Variables**
```env
# Required
DATABASE_URL=postgresql://user:password@host:port/database
BETTER_AUTH_SECRET=your-very-secure-secret-key
BETTER_AUTH_URL=https://yourdomain.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://yourdomain.com

# Optional
NODE_ENV=production
```

**2. Deploy Options**

**🐳 Docker (VPS/Server)**
```bash
# On your server
git clone <your-repo>
cd codeguide-starter-fullstack
cp .env.example .env
# Edit .env with production values
npm run docker:up
```

**☁️ Vercel**
```bash
npm i -g vercel
vercel
# Add DATABASE_URL and BETTER_AUTH_SECRET in Vercel dashboard
npm run db:push  # Push schema to your database
```

**🏗️ Container Registry**
```bash
docker build -t your-registry/codeguide-starter-fullstack .
docker push your-registry/codeguide-starter-fullstack
```

**3. Production Checklist**
- ✅ Use managed PostgreSQL (AWS RDS, Supabase, etc.)
- ✅ Generate strong `BETTER_AUTH_SECRET`
- ✅ Enable HTTPS
- ✅ Set up database backups
- ✅ Monitor application health

## 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
