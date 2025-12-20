const API_BASE = 'http://localhost:3001/api';

export interface AnalysisSummary {
    totalAgencies: number;
    totalTitles: number;
    totalWordCount: number;
    lastUpdated: string;
}

export interface Agency {
    slug: string;
    name: string;
    shortName: string;
    wordCount: number;
    checksum: string;
}

export interface AgencyAnalysis {
    slug: string;
    name: string;
    shortName: string;
    wordCount: number;
    sectionCount: number;
    titles: number[];
    checksum: string;
    previousChecksum?: string;  // Set if changed since last download
    mandateCount: number;
    penaltyCount: number;
    exemptionCount: number;
    definitionCount: number;
    reportingCount: number;
}

export interface MonthlyChange {
    month: string;
    changeCount: number;
}

export const METRIC_DEFINITIONS: Record<string, { label: string; description: string }> = {
    mandateCount: { label: 'Mandates', description: 'Binding requirements using "shall", "must", "required" - indicates regulatory burden' },
    penaltyCount: { label: 'Penalties', description: 'References to fines, violations, sanctions - indicates enforcement severity' },
    exemptionCount: { label: 'Exemptions', description: 'Exceptions and waivers available - indicates regulatory flexibility' },
    definitionCount: { label: 'Definitions', description: 'Legal terms defined - indicates precision and complexity of language' },
    reportingCount: { label: 'Reporting', description: 'Forms, filings, disclosures required - indicates administrative burden' }
};

export async function fetchSummary(): Promise<AnalysisSummary> {
    const res = await fetch(`${API_BASE}/analysis/summary`);
    return res.json();
}

export async function fetchWordCounts(limit = 15) {
    const res = await fetch(`${API_BASE}/analysis/word-counts?limit=${limit}`);
    return res.json();
}

export async function fetchHistory(): Promise<{ monthlyChanges: MonthlyChange[] }> {
    const res = await fetch(`${API_BASE}/analysis/history`);
    return res.json();
}

export async function fetchAgencies(): Promise<{ agencies: Agency[] }> {
    const res = await fetch(`${API_BASE}/agencies`);
    return res.json();
}

export async function fetchAgencyDetail(slug: string) {
    const res = await fetch(`${API_BASE}/agencies/${slug}`);
    return res.json();
}
