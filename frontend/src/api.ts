// Static data API for GitHub Pages hosting
// All data is pre-generated as JSON files in /data/

const BASE_URL = import.meta.env.BASE_URL || '/';
const DATA_PATH = `${BASE_URL}data`;

export interface AnalysisSummary {
    totalAgencies: number;
    totalTitles: number;
    totalWordCount: number;
    totalSections: number;
    avgComplexity: number;
    lastUpdated: string;
}

export interface AgencyWordCount {
    slug: string;
    name: string;
    wordCount: number;
}

export interface AgencyComplexity {
    slug: string;
    name: string;
    complexityScore: number;
    wordCount: number;
    sectionCount: number;
    avgWordsPerSection: number;
    burdenIndex: number;
    mandateDensity: number;
    penaltyScore: number;
    exemptionCount: number;
    definitionDensity: number;
    formReportingBurden: number;
    // New policy metrics
    prohibitionDensity: number;
    permissionBurden: number;
    complianceCostMentions: number;
    inspectionBurden: number;
    deadlineCount: number;
    discretionaryLanguage: number;
    smallBusinessMentions: number;
    crossReferenceCount: number;
}

export interface MonthlyChange {
    month: string;
    changeCount: number;
    titlesChanged: number;
}

export interface AgencyAnalysis {
    slug: string;
    name: string;
    shortName: string;
    wordCount: number;
    sectionCount: number;
    titleCount: number;
    checksum: string;
    complexityScore: number;
    avgWordsPerSection: number;
    titles: number[];
    // Deregulation metrics
    burdenIndex: number;
    mandateDensity: number;
    penaltyScore: number;
    exemptionCount: number;
    definitionDensity: number;
    formReportingBurden: number;
    lastSignificantUpdate: string;
    structureDepth: number;
    // New policy metrics
    prohibitionDensity: number;
    permissionBurden: number;
    complianceCostMentions: number;
    inspectionBurden: number;
    deadlineCount: number;
    discretionaryLanguage: number;
    smallBusinessMentions: number;
    crossReferenceCount: number;
}

export interface Agency {
    slug: string;
    name: string;
    shortName: string;
    titleCount: number;
    titles: number[];
}

// Fetch helpers for static JSON
async function fetchJSON<T>(path: string): Promise<T> {
    const response = await fetch(`${DATA_PATH}/${path}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
    }
    return response.json();
}

// API functions
export async function fetchSummary(): Promise<AnalysisSummary> {
    return fetchJSON<AnalysisSummary>('summary.json');
}

export async function fetchWordCounts(limit?: number): Promise<{ wordCounts: AgencyWordCount[] }> {
    const data = await fetchJSON<{ wordCounts: AgencyWordCount[] }>('word-counts.json');
    if (limit) {
        return { wordCounts: data.wordCounts.slice(0, limit) };
    }
    return data;
}

export async function fetchComplexity(limit?: number): Promise<{ complexityRanking: AgencyComplexity[] }> {
    const data = await fetchJSON<{ complexityRanking: AgencyComplexity[] }>('complexity.json');
    if (limit) {
        return { complexityRanking: data.complexityRanking.slice(0, limit) };
    }
    return data;
}

export async function fetchHistory(): Promise<{ monthlyChanges: MonthlyChange[] }> {
    return fetchJSON<{ monthlyChanges: MonthlyChange[] }>('history.json');
}

export async function fetchAgencies(): Promise<{ agencies: Agency[] }> {
    return fetchJSON<{ agencies: Agency[] }>('agencies.json');
}

export async function fetchAgencyDetail(slug: string): Promise<{
    agency: { name: string; shortName: string; titles: number[] };
    analysis: AgencyAnalysis | null;
    rankings: Record<string, { rank: number; total: number }> | null;
}> {
    return fetchJSON(`agencies/${slug}.json`);
}
