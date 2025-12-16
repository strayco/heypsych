#!/bin/bash
# scripts/update-provider-version.sh
#
# Updates the PROVIDER_DATA_VERSION environment variable after monthly data uploads
# This busts the Vercel Edge cache to ensure users get fresh provider data
#
# Usage:
#   ./scripts/update-provider-version.sh 2026-01    # Update to specific version
#   ./scripts/update-provider-version.sh            # Use current year-month

set -e

# Get new version (default to current YYYY-MM)
NEW_VERSION=${1:-$(date +"%Y-%m")}

# Validate format (YYYY-MM)
if ! [[ $NEW_VERSION =~ ^[0-9]{4}-[0-9]{2}$ ]]; then
  echo "❌ Error: Version must be in YYYY-MM format (e.g., 2026-01)"
  echo "Usage: $0 [YYYY-MM]"
  exit 1
fi

# File to update
ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: Could not find $ENV_FILE"
  exit 1
fi

# Get current version
CURRENT_VERSION=$(grep '^PROVIDER_DATA_VERSION=' "$ENV_FILE" | sed 's/.*=\(.*\)/\1/')

if [ -z "$CURRENT_VERSION" ]; then
  echo "⚠️  PROVIDER_DATA_VERSION not found in $ENV_FILE, will add it"
  CURRENT_VERSION="(not set)"
fi

echo "🔄 Updating provider data version..."
echo "   Current: $CURRENT_VERSION"
echo "   New:     $NEW_VERSION"
echo ""

# Update or add the version
if grep -q '^PROVIDER_DATA_VERSION=' "$ENV_FILE"; then
  # Update existing version
  sed -i.bak "s/^PROVIDER_DATA_VERSION=.*/PROVIDER_DATA_VERSION=$NEW_VERSION/" "$ENV_FILE"
else
  # Add version at end of file
  echo "" >> "$ENV_FILE"
  echo "# Provider data version - update after monthly NPPES imports to bust edge cache" >> "$ENV_FILE"
  echo "# Format: YYYY-MM (e.g., \"2025-12\" for December 2025 data)" >> "$ENV_FILE"
  echo "PROVIDER_DATA_VERSION=$NEW_VERSION" >> "$ENV_FILE"
fi

# Verify the change
NEW_VERSION_CHECK=$(grep '^PROVIDER_DATA_VERSION=' "$ENV_FILE" | sed 's/.*=\(.*\)/\1/')

if [ "$NEW_VERSION_CHECK" != "$NEW_VERSION" ]; then
  echo "❌ Error: Version update failed"
  echo "   Expected: $NEW_VERSION"
  echo "   Got:      $NEW_VERSION_CHECK"
  # Restore backup if exists
  if [ -f "$ENV_FILE.bak" ]; then
    mv "$ENV_FILE.bak" "$ENV_FILE"
  fi
  exit 1
fi

# Remove backup
rm -f "$ENV_FILE.bak"

echo "✅ Successfully updated $ENV_FILE to version $NEW_VERSION"
echo ""
echo "📝 Next steps:"
echo ""
echo "   1. Update production env var in Vercel:"
echo "      vercel env add PROVIDER_DATA_VERSION"
echo "      # When prompted, enter: $NEW_VERSION"
echo ""
echo "   2. Redeploy to apply changes:"
echo "      vercel --prod"
echo ""
echo "   3. Verify after deployment:"
echo "      curl \"https://your-domain.com/api/providers/search?state=CA&limit=1\" | jq .dataVersion"
echo ""
echo "🎯 This will bust the Vercel Edge cache and serve fresh provider data!"
