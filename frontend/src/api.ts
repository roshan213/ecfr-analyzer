const API_BASE = '/api';

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
    sectionCount: number;
}

export interface AgencyChecksum {
    slug: string;
    name: string;
    checksum: string;
    titleCount: number;
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

export async function fetchSummary(): Promise<AnalysisSummary> {
    const res = await fetch(`${API_BASE}/analysis/summary`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
}

export async function fetchWordCounts(limit = 20): Promise<{ wordCounts: AgencyWordCount[] }> {
    const res = await fetch(`${API_BASE}/analysis/word-counts?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch word counts');
    return res.json();
}

export async function fetchChecksums(): Promise<{ checksums: AgencyChecksum[] }> {
    const res = await fetch(`${API_BASE}/analysis/checksums`);
    if (!res.ok) throw new Error('Failed to fetch checksums');
    return res.json();
}

export async function fetchComplexity(limit = 20): Promise<{ complexityRanking: AgencyComplexity[] }> {
    const res = await fetch(`${API_BASE}/analysis/complexity?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch complexity');
    return res.json();
}

export async function fetchHistory(): Promise<{ monthlyChanges: MonthlyChange[] }> {
    const res = await fetch(`${API_BASE}/analysis/history`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
}

export async function fetchAgencies(): Promise<{ agencies: Agency[]; downloadedAt: string }> {
    const res = await fetch(`${API_BASE}/agencies`);
    if (!res.ok) throw new Error('Failed to fetch agencies');
    return res.json();
}

export async function fetchAgencyDetail(slug: string): Promise<{ agency: Agency; analysis: AgencyAnalysis | null }> {
    const res = await fetch(`${API_BASE}/agencies/${slug}`);
    if (!res.ok) throw new Error('Failed to fetch agency');
    return res.json();
}
