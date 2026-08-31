# HeyPsych Deployment Guide

**Status:** ✅ Ready for Production
**Last Updated:** 2025-11-13
**Primary Platform:** Vercel (recommended)

---

## Quick Start - Vercel (5 Minutes)

### Step 1: Login to Vercel
```bash
vercel login
```
Opens browser for authentication

### Step 2: Deploy
```bash
vercel --prod
```

Answer the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **heypsych** (or press Enter)
- Code directory? Press Enter (current directory)
- Override settings? **N**

Vercel will build and deploy automatically!

### Step 3: Add Environment Variables

Via **Vercel Dashboard** (recommended):
1. Go to your project → **Settings** → **Environment Variables**
2. Add each variable below
3. Select **Production, Preview, Development** for each
4. Click **Save**

**Required variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

**Recommended (for rate limiting & monitoring):**
```bash
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
SENTRY_AUTH_TOKEN=your-sentry-token
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### Step 4: Redeploy with Environment Variables
```bash
vercel --prod
```

### Step 5: Verify Deployment

Test these URLs (replace with your domain):
```bash
# Homepage
https://your-app.vercel.app

# Health check
https://your-app.vercel.app/api/health

# Conditions
https://your-app.vercel.app/conditions

# Treatments
https://your-app.vercel.app/treatments

# Resources
https://your-app.vercel.app/resources
```

✅ **Done!** Your site is live.

---

## Alternative: Deploy via GitHub

### Step 1: Push to GitHub
```bash
git push origin main
```

### Step 2: Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your `heypsych` repository
4. Click **Import**

### Step 3: Configure Project
- Framework Preset: **Next.js** (auto-detected)
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `.next`

### Step 4: Add Environment Variables
(Same as Quick Start Step 3 above)

### Step 5: Deploy
Click **Deploy** button

---

## Other Deployment Platforms

### Netlify

**Steps:**
```bash
# Install CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**Or use Git integration:**
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Site Settings
5. Deploy

---

### Railway

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Add environment variables
4. Deploy automatically on push to main

**Configuration:**
- Build command: `npm run build`
- Start command: `npm start`
- Port: 3000

---

### Self-Hosted (Docker)

**Create `Dockerfile`:**
```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**Update `next.config.ts`:**
```typescript
const nextConfig: NextConfig = {
  output: "standalone", // Add this line
  // ... rest of config
};
```

**Build and run:**
```bash
docker build -t heypsych .
docker run -p 3000:3000 --env-file .env.local heypsych
```

---

## Environment Variables Reference

### Database (Required)
```bash
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Site Configuration (Required)
```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_APP_ENV=production
```

### Rate Limiting (Recommended)
```bash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=Axxx
RATE_LIMIT_NEWSLETTER=5
RATE_LIMIT_SEARCH=60
RATE_LIMIT_API=100
```

### Error Tracking (Recommended)
```bash
SENTRY_AUTH_TOKEN=sntrys_xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Feature Flags (Optional)
```bash
NEXT_PUBLIC_ENABLE_ANIMATIONS=true
NEXT_PUBLIC_SHOW_INVESTIGATIONAL=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

---

## Pre-Deployment Checklist

### Code Quality
- [ ] `npm run build` passes
- [ ] `npm run typecheck` passes
- [ ] No console.logs in production code
- [ ] All tests passing (if applicable)

### Security
- [ ] All environment variables set (not in code)
- [ ] `.env.local` in `.gitignore`
- [ ] No sensitive data in repository
- [ ] Security headers configured
- [ ] Rate limiting enabled

### Content
- [ ] Database seeded with all content
- [ ] All routes accessible
- [ ] Error pages working (404, 500)

### SEO
- [ ] Meta tags configured
- [ ] `robots.txt` present
- [ ] `sitemap.xml` generated
- [ ] Canonical URLs set

---

## Post-Deployment Verification

### 1. Test Homepage
```bash
curl https://yourdomain.com
```
Should return HTML with no errors

### 2. Test API Routes
```bash
# Health check
curl https://yourdomain.com/api/health

# Provider search
curl "https://yourdomain.com/api/providers/search?state=CA&limit=5"
```

### 3. Test Dynamic Routes
Visit in browser:
- `/conditions/anxiety-fear`
- `/treatments/cbt`
- `/resources/phq-9`
- `/psychiatrists` (with state filter)

### 4. Check Browser Console
- Open DevTools
- Navigate to several pages
- Verify no JavaScript errors
- Verify no failed network requests

### 5. Test Mobile
- Resize browser to mobile width
- Test navigation
- Verify responsive design works

---

## Custom Domain Setup

### Vercel
1. Go to Project Settings → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `heypsych.com`)
4. Follow DNS configuration instructions:
   - Add A record or CNAME to your DNS provider
   - Wait for DNS propagation (~1 hour)
5. SSL certificate automatically provisioned

### Netlify
1. Go to Site Settings → **Domain Management**
2. Click **Add custom domain**
3. Configure DNS:
   - Point A record to Netlify's load balancer
   - Or use Netlify DNS
4. Enable HTTPS (automatic with Let's Encrypt)

---

## Monitoring Setup

### Vercel Analytics (Free)
Already enabled if you deployed to Vercel.

Check dashboard: `https://vercel.com/[your-team]/heypsych/analytics`

### Sentry (Error Tracking)
1. Create account at [sentry.io](https://sentry.io)
2. Create new Next.js project
3. Copy DSN to environment variables
4. Redeploy

### Uptime Monitoring
**Recommended: UptimeRobot (free tier)**
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Add monitors:
   - Main site (check every 5 min)
   - API health check (check every 5 min)
3. Set up email alerts

---

## CI/CD Setup

### GitHub Actions
Already configured in `.github/workflows/ci.yml`

**What it does:**
- Runs on every push to `main` and PRs
- Lints code
- Type-checks
- Builds project
- Runs security audit

**Add GitHub Secrets:**
1. Go to GitHub → Settings → Secrets and variables → Actions
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `VERCEL_TOKEN` (for auto-deploy)
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

---

## Troubleshooting

### Build Fails with "fetch failed"
**Issue:** Supabase connection during build
**Solution:** These are warnings, build should still succeed. Check environment variables are set correctly.

### Environment Variables Not Working
**Issue:** Variables not found in production
**Solution:**
- Ensure client-side variables start with `NEXT_PUBLIC_`
- Redeploy after adding new variables
- Check deployment platform's environment settings

### 404 on All Routes
**Issue:** Routing not working
**Solution:**
- Verify `next.config.ts` doesn't have conflicting basePath
- Check build output directory is `.next`
- Ensure deployment platform supports Next.js App Router

### Database Connection Errors
**Issue:** Can't connect to Supabase
**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check Supabase project is not paused (free tier)
- Verify anon key is valid
- Test connection with `npm run db:ensure`

### Rate Limiting Not Working
**Issue:** API calls not rate limited
**Solution:**
- Verify Upstash Redis credentials are set
- Check `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Rate limiting is disabled in development mode (expected)

---

## Performance Optimization

### After Deployment

1. **Enable Vercel Analytics**
   - Automatic for Vercel deployments
   - Monitor Core Web Vitals

2. **Check Bundle Size**
   ```bash
   npm run analyze
   ```

3. **Monitor API Response Times**
   - Use Sentry Performance Monitoring
   - Set alerts for p95 > 500ms

4. **Optimize Images**
   - Ensure using `next/image`
   - Consider external CDN for assets

---

## Rollback Procedure

### Vercel
1. Go to project dashboard
2. Click **Deployments**
3. Find previous working deployment
4. Click **...** → **Promote to Production**

### Via CLI
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

---

## Security Hardening Post-Deploy

1. **Enable Web Application Firewall** (if using Cloudflare)
2. **Set up backup strategy** for database
3. **Configure CORS** if needed for external APIs
4. **Add CSP report-uri** to monitor violations
5. **Set up log aggregation** (e.g., BetterStack)

---

## Success Indicators

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ All 54 routes generated
- ✅ Homepage loads in < 2 seconds
- ✅ No console errors in browser
- ✅ All API routes return data
- ✅ Database queries work
- ✅ Images load properly
- ✅ Mobile responsive design works
- ✅ SEO meta tags present

---

## Next Steps After Launch

1. **Monitor for 24 hours** - Watch Sentry and analytics
2. **Submit sitemap** to Google Search Console
3. **Set up uptime monitoring** with alerts
4. **Create runbook** for common issues
5. **Plan post-launch improvements**

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Supabase Docs**: https://supabase.com/docs
- **Launch Checklist**: [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)
- **Launch Status**: [LAUNCH.md](LAUNCH.md)

---

**Ready to deploy?** 🚀

Start with the Quick Start section at the top for the fastest path to production!
