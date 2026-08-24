/**
 * Practice Technology Index
 *
 * Foundation for HeyPsych's flagship data product.
 * Aggregates anonymized practice technology data for industry insights.
 *
 * Data Sources:
 * - Practice Architect sessions (stacks built)
 * - Behavioral fingerprints (aggregated)
 * - Demo requests (intent signals)
 * - Comparison activity (evaluation patterns)
 *
 * Output:
 * - Monthly/quarterly index reports
 * - Category trend analysis
 * - Switching pattern insights
 * - Market share estimates
 */

// ============================================================================
// TYPES
// ============================================================================

export interface IndexPeriod {
  start: string;  // ISO date
  end: string;    // ISO date
  type: "monthly" | "quarterly" | "annual";
}

export interface ProductMetrics {
  slug: string;
  name: string;
  category: string;

  // Evaluation metrics
  pageViews: number;
  comparisons: number;
  shortlists: number;
  demoRequests: number;

  // Computed scores
  evaluationScore: number;       // Normalized 0-100
  considerationScore: number;    // How often included in shortlists
  conversionRate: number;        // Demo requests / page views

  // Trends
  evaluationTrend: "rising" | "stable" | "declining";
  trendPercentage: number;       // vs previous period
}

export interface CategoryMetrics {
  slug: string;
  name: string;

  // Volume metrics
  totalEvaluations: number;
  totalComparisons: number;
  totalDemoRequests: number;
  averageStackPosition: number;  // Where in stack-building do practices add this category

  // Top products
  topProducts: Array<{
    slug: string;
    name: string;
    evaluationShare: number;     // % of category evaluations
  }>;

  // Trends
  growthRate: number;            // vs previous period
  isTrending: boolean;
}

export interface SwitchingMetrics {
  // Products people are switching FROM
  topSwitchingFrom: Array<{
    slug: string;
    name: string;
    count: number;
    topDestinations: string[];   // Where they're going
  }>;

  // Products gaining from switching
  topSwitchingTo: Array<{
    slug: string;
    name: string;
    count: number;
    topSources: string[];        // Where they're coming from
  }>;

  // Category-level switching
  categorySwitchingVolume: Record<string, number>;
}

export interface StackMetrics {
  // Average stack composition
  averageStackSize: number;
  averageCategoriesPerStack: number;

  // Most common combinations
  commonPairs: Array<{
    productA: string;
    productB: string;
    frequency: number;
  }>;

  // Gap analysis
  commonGaps: Array<{
    capability: string;
    percentWithGap: number;
  }>;

  // Overlap analysis
  commonOverlaps: Array<{
    capability: string;
    averageOverlapCount: number;
  }>;
}

export interface PracticeTypeMetrics {
  type: string;
  typeName: string;

  // Volume
  practiceCount: number;
  percentOfTotal: number;

  // Average stack
  averageStackSize: number;
  averageMonthlySpend: number;

  // Top products by type
  topProducts: Array<{
    slug: string;
    name: string;
    adoptionRate: number;
  }>;

  // Unique needs
  distinctiveCapabilities: string[];  // Capabilities this type prioritizes
}

export interface PracticeTechnologyIndex {
  period: IndexPeriod;
  generatedAt: string;

  // Summary metrics
  summary: {
    totalEvaluations: number;
    totalComparisons: number;
    totalDemoRequests: number;
    totalStacksBuilt: number;
    uniquePractices: number;     // Based on fingerprints
  };

  // Product-level data
  products: ProductMetrics[];

  // Category-level data
  categories: CategoryMetrics[];

  // Switching data
  switching: SwitchingMetrics;

  // Stack composition data
  stacks: StackMetrics;

  // Practice type breakdown
  practiceTypes: PracticeTypeMetrics[];

  // Key insights (human-written or AI-generated)
  insights: string[];
}

// ============================================================================
// INDEX GENERATION
// ============================================================================

/**
 * Generate index from aggregated data
 * In production, this would pull from analytics database
 */
export async function generateIndex(
  period: IndexPeriod,
  rawData: IndexRawData
): Promise<PracticeTechnologyIndex> {
  const products = aggregateProductMetrics(rawData);
  const categories = aggregateCategoryMetrics(rawData, products);
  const switching = aggregateSwitchingMetrics(rawData);
  const stacks = aggregateStackMetrics(rawData);
  const practiceTypes = aggregatePracticeTypeMetrics(rawData);

  return {
    period,
    generatedAt: new Date().toISOString(),
    summary: {
      totalEvaluations: rawData.pageViews.length,
      totalComparisons: rawData.comparisons.length,
      totalDemoRequests: rawData.demoRequests.length,
      totalStacksBuilt: rawData.stacks.length,
      uniquePractices: new Set(rawData.fingerprints.map(f => f.id)).size,
    },
    products,
    categories,
    switching,
    stacks,
    practiceTypes,
    insights: generateInsights(products, categories, switching),
  };
}

// ============================================================================
// RAW DATA TYPES
// ============================================================================

export interface IndexRawData {
  pageViews: Array<{
    productSlug: string;
    category: string;
    timestamp: string;
    fingerprintId?: string;
  }>;

  comparisons: Array<{
    products: string[];
    timestamp: string;
    fingerprintId?: string;
  }>;

  demoRequests: Array<{
    productSlug: string;
    category: string;
    practiceSize?: string;
    practiceType?: string;
    timestamp: string;
    fingerprintId?: string;
  }>;

  stacks: Array<{
    products: string[];
    practiceType?: string;
    practiceSize?: string;
    timestamp: string;
    fingerprintId?: string;
  }>;

  fingerprints: Array<{
    id: string;
    practiceType?: string;
    practiceSize?: string;
    switchingFrom?: string;
    productsViewed: string[];
    productsCompared: string[];
    productsShortlisted: string[];
  }>;

  alternatives: Array<{
    fromProduct: string;
    toProducts: string[];
    timestamp: string;
    fingerprintId?: string;
  }>;
}

// ============================================================================
// AGGREGATION FUNCTIONS
// ============================================================================

function aggregateProductMetrics(rawData: IndexRawData): ProductMetrics[] {
  const productMap = new Map<string, {
    slug: string;
    name: string;
    category: string;
    pageViews: number;
    comparisons: number;
    shortlists: number;
    demoRequests: number;
  }>();

  // Count page views
  for (const view of rawData.pageViews) {
    const existing = productMap.get(view.productSlug) || {
      slug: view.productSlug,
      name: view.productSlug, // Would be enriched from product data
      category: view.category,
      pageViews: 0,
      comparisons: 0,
      shortlists: 0,
      demoRequests: 0,
    };
    existing.pageViews++;
    productMap.set(view.productSlug, existing);
  }

  // Count comparisons
  for (const comp of rawData.comparisons) {
    for (const slug of comp.products) {
      const existing = productMap.get(slug);
      if (existing) {
        existing.comparisons++;
      }
    }
  }

  // Count shortlists from fingerprints
  for (const fp of rawData.fingerprints) {
    for (const slug of fp.productsShortlisted) {
      const existing = productMap.get(slug);
      if (existing) {
        existing.shortlists++;
      }
    }
  }

  // Count demo requests
  for (const demo of rawData.demoRequests) {
    const existing = productMap.get(demo.productSlug);
    if (existing) {
      existing.demoRequests++;
    }
  }

  // Calculate scores
  return Array.from(productMap.values()).map(product => {
    const evaluationScore = Math.min(100, Math.round(
      (product.pageViews / 10) +
      (product.comparisons * 5) +
      (product.shortlists * 10) +
      (product.demoRequests * 20)
    ));

    const considerationScore = product.pageViews > 0
      ? Math.round((product.shortlists / product.pageViews) * 100)
      : 0;

    const conversionRate = product.pageViews > 0
      ? Math.round((product.demoRequests / product.pageViews) * 1000) / 10
      : 0;

    return {
      ...product,
      evaluationScore,
      considerationScore,
      conversionRate,
      evaluationTrend: "stable" as const, // Would compare to previous period
      trendPercentage: 0,
    };
  }).sort((a, b) => b.evaluationScore - a.evaluationScore);
}

function aggregateCategoryMetrics(
  rawData: IndexRawData,
  products: ProductMetrics[]
): CategoryMetrics[] {
  const categoryMap = new Map<string, CategoryMetrics>();

  // Group products by category
  for (const product of products) {
    const existing = categoryMap.get(product.category) || {
      slug: product.category,
      name: product.category, // Would be enriched from taxonomy
      totalEvaluations: 0,
      totalComparisons: 0,
      totalDemoRequests: 0,
      averageStackPosition: 0,
      topProducts: [],
      growthRate: 0,
      isTrending: false,
    };

    existing.totalEvaluations += product.pageViews;
    existing.totalComparisons += product.comparisons;
    existing.totalDemoRequests += product.demoRequests;

    categoryMap.set(product.category, existing);
  }

  // Add top products to each category
  for (const [slug, category] of categoryMap) {
    const categoryProducts = products
      .filter(p => p.category === slug)
      .slice(0, 5)
      .map(p => ({
        slug: p.slug,
        name: p.name,
        evaluationShare: category.totalEvaluations > 0
          ? Math.round((p.pageViews / category.totalEvaluations) * 100)
          : 0,
      }));

    category.topProducts = categoryProducts;
    category.isTrending = category.growthRate > 10;
  }

  return Array.from(categoryMap.values())
    .sort((a, b) => b.totalEvaluations - a.totalEvaluations);
}

function aggregateSwitchingMetrics(rawData: IndexRawData): SwitchingMetrics {
  const switchingFrom = new Map<string, { count: number; destinations: string[] }>();
  const switchingTo = new Map<string, { count: number; sources: string[] }>();

  // Analyze alternatives views
  for (const alt of rawData.alternatives) {
    const from = switchingFrom.get(alt.fromProduct) || { count: 0, destinations: [] };
    from.count++;
    from.destinations.push(...alt.toProducts);
    switchingFrom.set(alt.fromProduct, from);

    for (const to of alt.toProducts) {
      const toData = switchingTo.get(to) || { count: 0, sources: [] };
      toData.count++;
      toData.sources.push(alt.fromProduct);
      switchingTo.set(to, toData);
    }
  }

  // Analyze fingerprints with switching intent
  for (const fp of rawData.fingerprints) {
    if (fp.switchingFrom) {
      const from = switchingFrom.get(fp.switchingFrom) || { count: 0, destinations: [] };
      from.count++;
      from.destinations.push(...fp.productsShortlisted);
      switchingFrom.set(fp.switchingFrom, from);
    }
  }

  return {
    topSwitchingFrom: Array.from(switchingFrom.entries())
      .map(([slug, data]) => ({
        slug,
        name: slug,
        count: data.count,
        topDestinations: [...new Set(data.destinations)].slice(0, 3),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),

    topSwitchingTo: Array.from(switchingTo.entries())
      .map(([slug, data]) => ({
        slug,
        name: slug,
        count: data.count,
        topSources: [...new Set(data.sources)].slice(0, 3),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),

    categorySwitchingVolume: {},
  };
}

function aggregateStackMetrics(rawData: IndexRawData): StackMetrics {
  const stackSizes = rawData.stacks.map(s => s.products.length);
  const averageStackSize = stackSizes.length > 0
    ? Math.round(stackSizes.reduce((a, b) => a + b, 0) / stackSizes.length * 10) / 10
    : 0;

  // Find common pairs
  const pairCounts = new Map<string, number>();
  for (const stack of rawData.stacks) {
    for (let i = 0; i < stack.products.length; i++) {
      for (let j = i + 1; j < stack.products.length; j++) {
        const pair = [stack.products[i], stack.products[j]].sort().join("|");
        pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
      }
    }
  }

  const commonPairs = Array.from(pairCounts.entries())
    .map(([pair, frequency]) => {
      const [productA, productB] = pair.split("|");
      return { productA, productB, frequency };
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  return {
    averageStackSize,
    averageCategoriesPerStack: averageStackSize * 0.8, // Rough estimate
    commonPairs,
    commonGaps: [], // Would require capability analysis
    commonOverlaps: [],
  };
}

function aggregatePracticeTypeMetrics(rawData: IndexRawData): PracticeTypeMetrics[] {
  const typeMap = new Map<string, {
    count: number;
    stackSizes: number[];
    productCounts: Map<string, number>;
  }>();

  for (const stack of rawData.stacks) {
    const type = stack.practiceType || "unknown";
    const existing = typeMap.get(type) || {
      count: 0,
      stackSizes: [] as number[],
      productCounts: new Map<string, number>(),
    };

    existing.count++;
    existing.stackSizes.push(stack.products.length);

    for (const product of stack.products) {
      existing.productCounts.set(product, (existing.productCounts.get(product) || 0) + 1);
    }

    typeMap.set(type, existing);
  }

  const totalPractices = rawData.stacks.length;

  return Array.from(typeMap.entries())
    .filter(([type]) => type !== "unknown")
    .map(([type, data]) => {
      const avgStackSize = data.stackSizes.length > 0
        ? Math.round(data.stackSizes.reduce((a, b) => a + b, 0) / data.stackSizes.length * 10) / 10
        : 0;

      const topProducts = Array.from(data.productCounts.entries())
        .map(([slug, count]) => ({
          slug,
          name: slug,
          adoptionRate: Math.round((count / data.count) * 100),
        }))
        .sort((a, b) => b.adoptionRate - a.adoptionRate)
        .slice(0, 5);

      return {
        type,
        typeName: type,
        practiceCount: data.count,
        percentOfTotal: totalPractices > 0 ? Math.round((data.count / totalPractices) * 100) : 0,
        averageStackSize: avgStackSize,
        averageMonthlySpend: 0, // Would require pricing data
        topProducts,
        distinctiveCapabilities: [],
      };
    })
    .sort((a, b) => b.practiceCount - a.practiceCount);
}

function generateInsights(
  products: ProductMetrics[],
  categories: CategoryMetrics[],
  switching: SwitchingMetrics
): string[] {
  const insights: string[] = [];

  // Top evaluated product
  if (products.length > 0) {
    insights.push(
      `${products[0].name} was the most evaluated product with ${products[0].pageViews} views.`
    );
  }

  // Fastest growing category
  const trendingCategory = categories.find(c => c.isTrending);
  if (trendingCategory) {
    insights.push(
      `${trendingCategory.name} is trending with ${trendingCategory.growthRate}% growth.`
    );
  }

  // Top switching activity
  if (switching.topSwitchingFrom.length > 0) {
    insights.push(
      `${switching.topSwitchingFrom[0].name} had the most switching activity with ${switching.topSwitchingFrom[0].count} practices exploring alternatives.`
    );
  }

  return insights;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

export function generateIndexReport(index: PracticeTechnologyIndex): string {
  let report = `# HeyPsych Practice Technology Index\n\n`;
  report += `**Period:** ${index.period.start} to ${index.period.end}\n`;
  report += `**Generated:** ${index.generatedAt}\n\n`;

  report += `## Summary\n\n`;
  report += `- **${index.summary.totalEvaluations.toLocaleString()}** product evaluations\n`;
  report += `- **${index.summary.totalComparisons.toLocaleString()}** product comparisons\n`;
  report += `- **${index.summary.totalDemoRequests.toLocaleString()}** demo requests\n`;
  report += `- **${index.summary.totalStacksBuilt.toLocaleString()}** practice stacks built\n`;
  report += `- **${index.summary.uniquePractices.toLocaleString()}** unique practices\n\n`;

  report += `## Key Insights\n\n`;
  for (const insight of index.insights) {
    report += `- ${insight}\n`;
  }
  report += `\n`;

  report += `## Top Evaluated Products\n\n`;
  report += `| Rank | Product | Category | Evaluations | Demo Requests |\n`;
  report += `|------|---------|----------|-------------|---------------|\n`;
  for (let i = 0; i < Math.min(10, index.products.length); i++) {
    const p = index.products[i];
    report += `| ${i + 1} | ${p.name} | ${p.category} | ${p.pageViews} | ${p.demoRequests} |\n`;
  }
  report += `\n`;

  report += `## Category Trends\n\n`;
  for (const cat of index.categories.slice(0, 5)) {
    report += `### ${cat.name}\n`;
    report += `- Total evaluations: ${cat.totalEvaluations}\n`;
    report += `- Demo requests: ${cat.totalDemoRequests}\n`;
    report += `- Top products: ${cat.topProducts.map(p => p.name).join(", ")}\n\n`;
  }

  report += `## Switching Activity\n\n`;
  report += `### Products with Most Switching Intent\n`;
  for (const s of index.switching.topSwitchingFrom.slice(0, 5)) {
    report += `- ${s.name}: ${s.count} practices exploring alternatives\n`;
  }
  report += `\n`;

  report += `### Products Gaining from Switches\n`;
  for (const s of index.switching.topSwitchingTo.slice(0, 5)) {
    report += `- ${s.name}: ${s.count} considerations from switchers\n`;
  }

  return report;
}

// IndexRawData is exported inline above
