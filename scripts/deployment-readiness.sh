#!/bin/bash

# Phase 2 Deployment Readiness Check
# Verifies all systems before staging deployment

set -e

echo "🔍 Phase 2 Deployment Readiness Check"
echo "======================================"
echo ""

# Check 1: TypeScript compilation
echo "1️⃣  Checking TypeScript compilation..."
npm run typecheck || { echo "❌ TypeScript errors found"; exit 1; }
echo "✅ TypeScript: PASS"
echo ""

# Check 2: Linting
echo "2️⃣  Checking code quality..."
npm run lint || { echo "❌ Linting errors found"; exit 1; }
echo "✅ Linting: PASS"
echo ""

# Check 3: Build verification
echo "3️⃣  Verifying production build..."
npm run build || { echo "❌ Build failed"; exit 1; }
echo "✅ Build: PASS"
echo ""

# Check 4: Git status
echo "4️⃣  Checking git status..."
if [[ -n $(git status -s) ]]; then
  echo "⚠️  Uncommitted changes detected:"
  git status -s
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo "✅ Git status: Clean"
fi
echo ""

# Check 5: Current branch
echo "5️⃣  Verifying current branch..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"
if [[ "$CURRENT_BRANCH" != "develop" && "$CURRENT_BRANCH" != "main" ]]; then
  echo "⚠️  Not on develop or main branch"
  read -p "Continue from $CURRENT_BRANCH? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
echo ""

# Summary
echo "======================================"
echo "✅ DEPLOYMENT READINESS: PASSED"
echo "======================================"
echo ""
echo "Ready to deploy to staging!"
echo ""
echo "Next steps:"
echo "  1. Commit any remaining changes"
echo "  2. Push to develop: git push origin develop"
echo "  3. Monitor Vercel deployment"
echo "  4. Run staging validation"
echo ""
