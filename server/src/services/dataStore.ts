import * as fs from 'fs';
import * as path from 'path';
import { Agency, Title, TitleVersion, StructureNode } from './ecfrClient';

const DATA_DIR = path.join(__dirname, '../../data');

export interface StoredAgencyData {
    agencies: Agency[];
    flatAgencies: FlatAgency[];
    downloadedAt: string;
}

export interface FlatAgency {
    name: string;
    short_name: string;
    slug: string;
    titles: number[];
    chapters: string[];
    parentSlug?: string;
}

export interface StoredTitleData {
    titles: Title[];
    downloadedAt: string;
}

export interface TextMetrics {
    // Original metrics
    mandateCount: number;       // shall, must, required, mandatory
    penaltyCount: number;       // penalty, fine, violation, enforcement, sanction
    exemptionCount: number;     // except, exemption, waiver, exclusion, unless
    definitionCount: number;    // terms defined
    reportingCount: number;     // report, form, submit, filing, disclosure
    // New policy-relevant metrics
    prohibitionCount: number;   // shall not, prohibited, may not, forbidden
    permissionCount: number;    // permit, license, approval, authorization, certificate
    complianceCostCount: number; // cost, fee, expense, payment, charge
    inspectionCount: number;    // inspection, audit, examination, review, monitor
    deadlineCount: number;      // within X days, no later than, deadline
    discretionaryCount: number; // may, discretion, reasonable, appropriate
    smallBusinessCount: number; // small business, small entity, SME
    crossReferenceCount: number; // references to other CFR parts/sections
}

export interface StoredTitleContent {
    titleNumber: number;
    structure: StructureNode;
    versions: TitleVersion[];
    wordCount: number;
    sectionCount: number;
    xmlSize: number;
    xmlChecksum: string;
    downloadedAt: string;
    // New text analysis metrics
    textMetrics: TextMetrics;
    structureDepth: number;
    lastSignificantUpdate: string;
}

export interface AnalysisCache {
    agencyAnalysis: AgencyAnalysis[];
    summary: AnalysisSummary;
    generatedAt: string;
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
    // New deregulation metrics
    burdenIndex: number;          // 0-100 overall burden score
    mandateDensity: number;       // mandates per 1000 words
    penaltyScore: number;         // 0-10 enforcement burden
    exemptionCount: number;       // total exemptions found
    definitionDensity: number;    // definitions per 1000 words
    formReportingBurden: number;  // reporting requirements count
    lastSignificantUpdate: string; // ISO date
    structureDepth: number;       // max CFR hierarchy depth
    // Additional policy metrics
    prohibitionDensity: number;   // prohibitions per 1000 words
    permissionBurden: number;     // permit/license requirements count
    complianceCostMentions: number; // cost/fee language count
    inspectionBurden: number;     // inspection/audit requirements
    deadlineCount: number;        // timing requirements
    discretionaryLanguage: number; // flexibility indicators
    smallBusinessMentions: number; // SMB consideration count
    crossReferenceCount: number;  // regulatory interconnectedness
}

export interface AnalysisSummary {
    totalAgencies: number;
    totalTitles: number;
    totalWordCount: number;
    totalSections: number;
    avgComplexity: number;
    lastUpdated: string;
}

class DataStore {
    constructor() {
        this.ensureDataDir();
    }

    private ensureDataDir() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    }

    private getFilePath(filename: string): string {
        return path.join(DATA_DIR, filename);
    }

    // Agency data
    saveAgencies(data: StoredAgencyData): void {
        fs.writeFileSync(this.getFilePath('agencies.json'), JSON.stringify(data, null, 2));
    }

    getAgencies(): StoredAgencyData | null {
        const filePath = this.getFilePath('agencies.json');
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    // Title data
    saveTitles(data: StoredTitleData): void {
        fs.writeFileSync(this.getFilePath('titles.json'), JSON.stringify(data, null, 2));
    }

    getTitles(): StoredTitleData | null {
        const filePath = this.getFilePath('titles.json');
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    // Individual title content
    saveTitleContent(titleNumber: number, data: StoredTitleContent): void {
        fs.writeFileSync(this.getFilePath(`title-${titleNumber}.json`), JSON.stringify(data, null, 2));
    }

    getTitleContent(titleNumber: number): StoredTitleContent | null {
        const filePath = this.getFilePath(`title-${titleNumber}.json`);
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    getAllTitleContents(): StoredTitleContent[] {
        const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('title-') && f.endsWith('.json'));
        return files.map(f => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')));
    }

    // Analysis cache
    saveAnalysisCache(data: AnalysisCache): void {
        fs.writeFileSync(this.getFilePath('analysis-cache.json'), JSON.stringify(data, null, 2));
    }

    getAnalysisCache(): AnalysisCache | null {
        const filePath = this.getFilePath('analysis-cache.json');
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    // Historical versions data
    saveVersionHistory(titleNumber: number, versions: TitleVersion[]): void {
        fs.writeFileSync(this.getFilePath(`versions-${titleNumber}.json`), JSON.stringify({
            titleNumber,
            versions,
            savedAt: new Date().toISOString()
        }, null, 2));
    }

    getVersionHistory(titleNumber: number): { titleNumber: number; versions: TitleVersion[] } | null {
        const filePath = this.getFilePath(`versions-${titleNumber}.json`);
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    getAllVersionHistories(): { titleNumber: number; versions: TitleVersion[] }[] {
        const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('versions-') && f.endsWith('.json'));
        return files.map(f => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')));
    }

    hasData(): boolean {
        return fs.existsSync(this.getFilePath('agencies.json')) &&
            fs.existsSync(this.getFilePath('titles.json'));
    }
}

export const dataStore = new DataStore();
