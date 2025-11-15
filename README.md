# HeyPsych - Mental Health Treatment Education Platform

**Status:** ✅ Production Ready
**Version:** 0.1.0
**Stack:** Next.js 15, React 19, TypeScript, Supabase, Tailwind CSS

---

## Overview

HeyPsych is a comprehensive mental health education platform providing evidence-based information about mental health conditions, treatments, resources, and providers. Built with modern web technologies for performance, accessibility, and scalability.

### Key Features

- **164 Mental Health Conditions** - Organized by DSM-5 categories
- **568 Treatment Options** - Medications, therapy, alternative approaches
- **100+ Clinical Resources** - Assessments, screeners, crisis lines, digital tools
- **70,000+ Psychiatrists** - Searchable provider directory (NPPES data)
- **Knowledge Hub** - Curated articles and educational content
- **Interactive Tools** - Assessments with real-time scoring (PHQ-9, GAD-7, etc.)

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/heypsych.git
cd heypsych

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Seed the database
npm run seed:all

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Documentation

Comprehensive documentation is available in the [docs/](docs/) directory.

### Essential Docs
- **[docs/INDEX.md](docs/INDEX.md)** - Documentation index and navigation
- **[docs/LAUNCH.md](docs/LAUNCH.md)** - Production launch status and checklist
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide (Vercel, Railway, Docker)
- **[docs/CODE_STRUCTURE.md](docs/CODE_STRUCTURE.md)** - Architecture and codebase overview

### Feature Docs
- **[docs/RESOURCES.md](docs/RESOURCES.md)** - Resources system (add new resources via JSON)
- **[docs/PSYCHIATRIST_SEEDING.md](docs/PSYCHIATRIST_SEEDING.md)** - Monthly psychiatrist data updates
- **[docs/KNOWLEDGE_HUB.md](docs/KNOWLEDGE_HUB.md)** - Content architecture

### Security & Operations
- **[docs/SECURITY.md](docs/SECURITY.md)** - Security hardening implementation
- **[docs/AUDIT.md](docs/AUDIT.md)** - Code health and security audit

---

## Technology Stack

### Core
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (PostgreSQL)

### Key Libraries
- **Data Fetching:** React Query (@tanstack/react-query)
- **State Management:** Zustand
- **Validation:** Zod
- **Components:** Radix UI primitives
- **Animations:** Framer Motion

### Infrastructure
- **Hosting:** Vercel (recommended)
- **Error Tracking:** Sentry
- **Analytics:** Vercel Analytics
- **Rate Limiting:** Upstash Redis

---

## Project Structure

```
heypsych/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── conditions/         # Mental health conditions
│   │   ├── treatments/         # Treatment options
│   │   ├── resources/          # Clinical resources
│   │   ├── psychiatrists/      # Provider directory
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   ├── blocks/             # Feature blocks
│   │   ├── layout/             # Layout components
│   │   ├── resource-renderers/ # Resource display components
│   │   └── ui/                 # UI primitives
│   └── lib/                    # Utilities and shared logic
│       ├── config/             # Configuration
│       ├── types/              # TypeScript definitions
│       ├── schemas/            # Zod schemas
│       └── utils/              # Helper functions
├── data/                       # Static JSON data
│   ├── conditions/             # Condition definitions
│   ├── treatments/             # Treatment definitions
│   └── resources/              # Resource definitions
├── scripts/                    # Build and maintenance scripts
├── docs/                       # Documentation
└── public/                     # Static assets
```

See [docs/CODE_STRUCTURE.md](docs/CODE_STRUCTURE.md) for detailed architecture.

---

## Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # Run TypeScript type checking
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Database & Seeding
```bash
npm run db:ensure            # Ensure database exists
npm run seed:all             # Seed all data
npm run seed:conditions      # Seed conditions only
npm run seed:treatments      # Seed treatments only
npm run seed:resources       # Seed resources only
npm run seed:assessments     # Seed assessments only
```

### Providers
```bash
npm run import-nppes         # Import psychiatrist data from NPPES
npm run provider-stats       # View provider statistics
```

### Analysis
```bash
npm run analyze              # Analyze bundle size
```

---

## Key Features

### Dynamic Content System
All content is JSON-driven:
- **Conditions** - `data/conditions/`
- **Treatments** - `data/treatments/`
- **Resources** - `data/resources/`

Add new content by creating JSON files and running the seeder. No code changes required.

### Interactive Assessments
Built-in support for clinical screening tools:
- Real-time scoring
- Clinical interpretation
- Multiple scoring algorithms (sum_with_bands, ASSIST-WHO-V3, ASRS-custom)
- Print/save results

### Provider Search
Searchable directory of 70,000+ psychiatrists:
- Filter by state, city, zip code
- Filter by specialty
- Data from NPPES (National Plan and Provider Enumeration System)
- Monthly updates available

### SEO Optimized
- Dynamic sitemap generation
- Meta tags and OpenGraph
- Schema.org structured data
- robots.txt configured

---

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Database (Required)
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Site Config
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Rate Limiting (Recommended)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=Axxx

# Error Tracking (Recommended)
SENTRY_AUTH_TOKEN=sntrys_xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

---

## Deployment

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Then add environment variables in Vercel Dashboard → Settings → Environment Variables.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions, including Railway, Netlify, and Docker deployment.

---

## Contributing

### Adding Content

**Conditions:**
1. Create JSON in `data/conditions/[category]/`
2. Run `npm run seed:conditions`

**Treatments:**
1. Create JSON in `data/treatments/[category]/`
2. Run `npm run seed:treatments`

**Resources:**
1. Create JSON in `data/resources/[category]/`
2. Run `npm run seed:resources`

See [docs/RESOURCES.md](docs/RESOURCES.md) for detailed resource creation guide.

### Code Contributions

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test: `npm run typecheck && npm run build`
4. Commit with clear message: `git commit -m "Add feature X"`
5. Push and create pull request

---

## Monthly Maintenance

### Update Psychiatrist Data
Run monthly to sync with latest NPPES data:

```bash
# Download latest NPPES file from https://download.cms.gov/nppes/
# Unzip to data/nppes/

npm run import-nppes -- --file=data/nppes/npidata_pfile_*.csv --batch=100
```

See [docs/PSYCHIATRIST_SEEDING.md](docs/PSYCHIATRIST_SEEDING.md) for detailed guide.

---

## Support & Resources

- **Documentation:** [docs/INDEX.md](docs/INDEX.md)
- **Issues:** [GitHub Issues](https://github.com/yourusername/heypsych/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/heypsych/discussions)

### External Resources
- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **NPPES Data:** https://download.cms.gov/nppes/

---

## License

[Add your license here]

---

## Acknowledgments

- Mental health content based on evidence-based research
- Provider data from CMS National Plan and Provider Enumeration System (NPPES)
- Built with modern open-source technologies

---

**Ready to deploy?** See [docs/LAUNCH.md](docs/LAUNCH.md) for launch readiness checklist.

**Need help?** Check [docs/INDEX.md](docs/INDEX.md) for comprehensive documentation.
