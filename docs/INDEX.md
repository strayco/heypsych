# HeyPsych Documentation Index

**Last Updated:** 2025-11-13
**Project Status:** Production Ready

---

## Quick Links

- **Getting Started** → [README.md](../README.md)
- **Launch Status** → [LAUNCH.md](LAUNCH.md)
- **Deployment** → [DEPLOYMENT.md](DEPLOYMENT.md)
- **Code Structure** → [CODE_STRUCTURE.md](CODE_STRUCTURE.md)

---

## Documentation Categories

### 🚀 Launch & Deployment

| Document | Description | Status |
|----------|-------------|--------|
| [LAUNCH.md](LAUNCH.md) | Production readiness assessment & implementation status | ✅ Complete |
| [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) | Pre-launch verification checklist | ✅ Active |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deployment guide (Vercel, Railway, Docker) | ✅ Complete |

### 🔒 Security & Hardening

| Document | Description | Status |
|----------|-------------|--------|
| [SECURITY.md](SECURITY.md) | Production hardening implementation | ✅ Complete |
| [AUDIT.md](AUDIT.md) | Code health and security audit results | ✅ Complete |

### 📚 Features & Implementation

| Document | Description | Status |
|----------|-------------|--------|
| [RESOURCES.md](RESOURCES.md) | Resources section implementation guide | ✅ Complete |
| [KNOWLEDGE_HUB.md](KNOWLEDGE_HUB.md) | Knowledge Hub migration details | ✅ Complete |
| [CRISIS_HOTLINES.md](CRISIS_HOTLINES.md) | Crisis hotlines feature documentation | ✅ Complete |

### 💾 Data & Operations

| Document | Description | Status |
|----------|-------------|--------|
| [PSYCHIATRIST_SEEDING.md](PSYCHIATRIST_SEEDING.md) | Monthly NPPES psychiatrist import guide | ✅ Active |
| [CODE_STRUCTURE.md](CODE_STRUCTURE.md) | Codebase architecture and organization | ✅ Reference |

---

## By Use Case

### I want to...

#### Deploy to Production
1. Read [LAUNCH.md](LAUNCH.md) - Check launch readiness
2. Review [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) - Verify all items
3. Follow [DEPLOYMENT.md](DEPLOYMENT.md) - Deploy to Vercel/Railway/Docker
4. Complete post-deployment verification

#### Understand the Codebase
1. Start with [CODE_STRUCTURE.md](CODE_STRUCTURE.md) - Architecture overview
2. Read [RESOURCES.md](RESOURCES.md) - Understand resources system
3. Check [KNOWLEDGE_HUB.md](KNOWLEDGE_HUB.md) - Content architecture

#### Update Psychiatrist Data
1. Follow [PSYCHIATRIST_SEEDING.md](PSYCHIATRIST_SEEDING.md) - Monthly NPPES import
2. Run `npm run import-nppes` - Import latest data
3. Run `npm run provider-stats` - Verify results

#### Review Security
1. Read [SECURITY.md](SECURITY.md) - Hardening implementation
2. Check [AUDIT.md](AUDIT.md) - Security audit results
3. Review [LAUNCH.md](LAUNCH.md) security section

#### Add New Resources
1. Read [RESOURCES.md](RESOURCES.md) - Resources guide
2. Create JSON file in `data/resources/[category]/`
3. Run `npm run seed:resources`

---

## Document Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Complete | Finished implementation, ready for use |
| ✅ Active | Ongoing operational guide |
| ✅ Reference | Architecture/structure documentation |
| ⚠️ In Progress | Being actively developed |
| 🗑️ Deprecated | Outdated, kept for historical reference |

---

## Maintenance Schedule

### Monthly
- Update psychiatrist database ([PSYCHIATRIST_SEEDING.md](PSYCHIATRIST_SEEDING.md))
- Review and update [INDEX.md](INDEX.md) (this file)

### Quarterly
- Review [CODE_STRUCTURE.md](CODE_STRUCTURE.md) for accuracy
- Update [DEPLOYMENT.md](DEPLOYMENT.md) with new platforms/methods

### As Needed
- Update [LAUNCH.md](LAUNCH.md) when security requirements change
- Update [RESOURCES.md](RESOURCES.md) when adding new resource categories
- Update [SECURITY.md](SECURITY.md) after major hardening work

---

## Contributing to Documentation

### When to Create New Docs
- New major feature (e.g., user authentication)
- New deployment platform
- Significant architectural change
- New operational procedure

### When to Update Existing Docs
- Bug fixes or clarifications
- New examples or use cases
- Updated metrics or statistics
- Changed procedures

### Documentation Standards
- Use markdown format
- Include table of contents for docs > 200 lines
- Add last updated date
- Include code examples where applicable
- Link to related docs
- Keep language clear and concise

---

## External Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Deployment**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **NPPES Data**: https://download.cms.gov/nppes/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Getting Help

**Found an error in the docs?**
- Open an issue or submit a pull request

**Need clarification?**
- Check related documents in the same category
- Review [CODE_STRUCTURE.md](CODE_STRUCTURE.md) for architecture questions
- Consult external resources above

---

**Navigation**: [← Back to Root README](../README.md)
