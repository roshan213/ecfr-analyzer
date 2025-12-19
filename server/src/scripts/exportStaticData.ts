/**
 * Export static JSON data for GitHub Pages hosting
 * Run with: npx tsx src/scripts/exportStaticData.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { dataStore } from '../services/dataStore';
import { analyzer } from '../services/analyzer';

const FRONTEND_PUBLIC = path.join(__dirname, '../../../frontend/public/data');

// Ensure output directory exists
if (!fs.existsSync(FRONTEND_PUBLIC)) {
    fs.mkdirSync(FRONTEND_PUBLIC, { recursive: true });
}

console.log('📦 Exporting static data for GitHub Pages...\n');

// Check if data exists
if (!dataStore.hasData()) {
    console.error('❌ No data available. Run npm run download first.');
    process.exit(1);
}

// Get data from dataStore and analyzer
const analysisCache = analyzer.getAnalysis();
const agencyData = dataStore.getAgencies();

if (!agencyData) {
    console.error('❌ Could not load agency data.');
    process.exit(1);
}

// 1. Export summary (use the summary from the cache)
const summary = {
    totalAgencies: analysisCache.summary.totalAgencies,
    totalTitles: analysisCache.summary.totalTitles,
    totalWordCount: analysisCache.summary.totalWordCount,
    totalSections: analysisCache.summary.totalSections,
    avgComplexity: analysisCache.summary.avgComplexity,
    lastUpdated: analysisCache.summary.lastUpdated
};
fs.writeFileSync(
    path.join(FRONTEND_PUBLIC, 'summary.json'),
    JSON.stringify(summary, null, 2)
);
console.log('✅ Exported summary.json');

// 2. Export word counts (top 15)
const wordCounts = analysisCache.agencyAnalysis
    .filter(a => a.wordCount > 0)
    .sort((a, b) => b.wordCount - a.wordCount)
    .slice(0, 15)
    .map(a => ({
        slug: a.slug,
        name: a.shortName || a.name,
        wordCount: a.wordCount
    }));
fs.writeFileSync(
    path.join(FRONTEND_PUBLIC, 'word-counts.json'),
    JSON.stringify({ wordCounts }, null, 2)
);
console.log('✅ Exported word-counts.json');

// 3. Export complexity data (all agencies with data)
const complexityRanking = analysisCache.agencyAnalysis
    .filter(a => a.wordCount > 0)
    .sort((a, b) => b.complexityScore - a.complexityScore)
    .map(a => ({
        slug: a.slug,
        name: a.shortName || a.name,
        complexityScore: a.complexityScore,
        wordCount: a.wordCount,
        sectionCount: a.sectionCount,
        avgWordsPerSection: a.avgWordsPerSection,
        burdenIndex: a.burdenIndex,
        mandateDensity: a.mandateDensity,
        penaltyScore: a.penaltyScore,
        exemptionCount: a.exemptionCount,
        definitionDensity: a.definitionDensity,
        formReportingBurden: a.formReportingBurden,
        prohibitionDensity: a.prohibitionDensity,
        permissionBurden: a.permissionBurden,
        complianceCostMentions: a.complianceCostMentions,
        inspectionBurden: a.inspectionBurden,
        deadlineCount: a.deadlineCount,
        discretionaryLanguage: a.discretionaryLanguage,
        smallBusinessMentions: a.smallBusinessMentions,
        crossReferenceCount: a.crossReferenceCount
    }));
fs.writeFileSync(
    path.join(FRONTEND_PUBLIC, 'complexity.json'),
    JSON.stringify({ complexityRanking }, null, 2)
);
console.log('✅ Exported complexity.json');

// 4. Export monthly changes history
const monthlyChanges = analyzer.getMonthlyChanges();
fs.writeFileSync(
    path.join(FRONTEND_PUBLIC, 'history.json'),
    JSON.stringify({ monthlyChanges }, null, 2)
);
console.log('✅ Exported history.json');

// 5. Export agencies list
const agencies = agencyData.flatAgencies.map(a => ({
    slug: a.slug,
    name: a.name,
    shortName: a.short_name,
    titleCount: a.titles.length,
    titles: a.titles
}));
fs.writeFileSync(
    path.join(FRONTEND_PUBLIC, 'agencies.json'),
    JSON.stringify({ agencies }, null, 2)
);
console.log('✅ Exported agencies.json');

// 6. Export individual agency details with rankings
const allAgencies = analysisCache.agencyAnalysis.filter(a => a.wordCount > 0);
const total = allAgencies.length;

// Helper to compute rank
const getRank = (sorted: any[], slug: string) => {
    const idx = sorted.findIndex(a => a.slug === slug);
    return idx >= 0 ? idx + 1 : total;
};

// Pre-sort for all metrics
const sortedByMetric: Record<string, any[]> = {};
const metricKeys = [
    'burdenIndex', 'mandateDensity', 'penaltyScore', 'exemptionCount',
    'definitionDensity', 'formReportingBurden', 'complexityScore', 'structureDepth',
    'prohibitionDensity', 'permissionBurden', 'complianceCostMentions', 'inspectionBurden',
    'deadlineCount', 'discretionaryLanguage', 'smallBusinessMentions', 'crossReferenceCount',
    'wordCount', 'sectionCount'
];

for (const key of metricKeys) {
    sortedByMetric[key] = [...allAgencies].sort((a, b) =>
        ((b as any)[key] || 0) - ((a as any)[key] || 0)
    );
}

// Export each agency
const agenciesDir = path.join(FRONTEND_PUBLIC, 'agencies');
if (!fs.existsSync(agenciesDir)) {
    fs.mkdirSync(agenciesDir, { recursive: true });
}

let exportedCount = 0;
for (const agencyInfo of agencyData.flatAgencies) {
    const agencyAnalysis = analysisCache.agencyAnalysis.find(a => a.slug === agencyInfo.slug);

    // Calculate rankings if analysis exists
    let rankings: Record<string, { rank: number; total: number }> | null = null;
    if (agencyAnalysis && agencyAnalysis.wordCount > 0) {
        rankings = {};
        for (const key of metricKeys) {
            rankings[key] = {
                rank: getRank(sortedByMetric[key], agencyInfo.slug),
                total
            };
        }
    }

    const agencyDetail = {
        agency: {
            slug: agencyInfo.slug,
            name: agencyInfo.name,
            shortName: agencyInfo.short_name,
            titles: agencyInfo.titles,
            chapters: agencyInfo.chapters
        },
        analysis: agencyAnalysis || null,
        rankings
    };

    fs.writeFileSync(
        path.join(agenciesDir, `${agencyInfo.slug}.json`),
        JSON.stringify(agencyDetail, null, 2)
    );
    exportedCount++;
}
console.log(`✅ Exported ${exportedCount} agency detail files`);

console.log('\n✨ Static data export complete!');
console.log(`   Output directory: ${FRONTEND_PUBLIC}`);
