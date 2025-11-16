#!/bin/bash
# Apply pagination fixes to unbounded queries
# Run from project root: chmod +x scripts/apply-pagination-fixes.sh && ./scripts/apply-pagination-fixes.sh

set -e

echo "🔧 Applying pagination fixes to prevent unbounded queries..."

FILE="src/lib/hooks/use-entities.ts"

echo "📝 Adding .limit(200) to useMedications()..."
perl -i -pe 's/(\.eq\("status", "active"\)\s*\.order\("title"\);)(\s*if \(error\) throw error;)/\1\n        .limit(200); \/\/ Prevent unbounded query\n\n$2/ if /function useMedications/..0' "$FILE"

echo "📝 Adding .limit(200) to useConditions()..."
sed -i '' '/function useConditions/,/if (error) throw error/ {
  s/\.order("title");/\.order("title")\
        .limit(200); \/\/ Prevent unbounded query/
}' "$FILE"

echo "📝 Adding .limit(100) to useInterventionalTreatments()..."
sed -i '' '/function useInterventionalTreatments/,/if (error) throw error/ {
  s/\.order("title");/\.order("title")\
        .limit(100); \/\/ Prevent unbounded query/
}' "$FILE"

echo "📝 Adding .limit(100) to useSupplements()..."
sed -i '' '/function useSupplements/,/if (error) throw error/ {
  s/\.order("title");/\.order("title")\
        .limit(100); \/\/ Prevent unbounded query/
}' "$FILE"

echo "📝 Adding .limit(100) to useTherapies()..."
sed -i '' '/function useTherapies/,/if (error) throw error/ {
  s/\.order("title");/\.order("title")\
        .limit(100); \/\/ Prevent unbounded query/
}' "$FILE"

echo "📝 Adding .limit(100) to useAlternativeTreatments()..."
sed -i '' '/function useAlternativeTreatments/,/if (error) throw error/ {
  s/\.order("title");/\.order("title")\
        .limit(100); \/\/ Prevent unbounded query/
}' "$FILE"

echo "📝 Adding .limit(100) to useInvestigationalTreatments()..."
sed -i '' '/function useInvestigationalTreatments/,/if (error) throw error/ {
  s/\.order("title");/\.order("title")\
        .limit(100); \/\/ Prevent unbounded query/
}' "$FILE"

echo "📝 Adding .limit(200) to useProviders()..."
sed -i '' '/function useProviders/,/if (error) throw error/ {
  s/\.order("title");/\.order("title")\
        .limit(200); \/\/ Prevent unbounded query/
}' "$FILE"

echo "✅ Pagination fixes applied!"
echo "🔍 Run 'git diff src/lib/hooks/use-entities.ts' to review changes"
