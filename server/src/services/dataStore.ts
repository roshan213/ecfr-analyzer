import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');

export interface FlatAgency {
    name: string;
    short_name: string;
    slug: string;
    titles: number[];
}

export interface StoredAgencyData {
    agencies: any[];
    flatAgencies: FlatAgency[];
    downloadedAt: string;
}

export interface TextMetrics {
    mandateCount: number;      // shall, must, required, mandatory
    penaltyCount: number;      // penalty, fine, violation, enforcement
    exemptionCount: number;    // except, exemption, waiver, exclusion
    definitionCount: number;   // terms defined
    reportingCount: number;    // report, form, submit, filing
}

export interface StoredTitleContent {
    titleNumber: number;
    structure: any;
    wordCount: number;
    sectionCount: number;
    textMetrics?: TextMetrics;
}

export interface TitleVersion {
    date: string;
    amendment_date: string;
}

export interface AgencyAnalysis {
    slug: string;
    name: string;
    shortName: string;
    wordCount: number;
    sectionCount: number;
    titles: number[];
    checksum: string;
    previousChecksum?: string;  // For change detection
    // Metrics (counts)
    mandateCount: number;
    penaltyCount: number;
    exemptionCount: number;
    definitionCount: number;
    reportingCount: number;
}

export interface MonthlyChange {
    month: string;
    changeCount: number;
    titlesChanged: number;
}

export interface AnalysisCache {
    agencyAnalysis: AgencyAnalysis[];
    summary: { totalAgencies: number; totalTitles: number; totalWordCount: number; lastUpdated: string };
    generatedAt: string;
}

class DataStore {
    private getFilePath(filename: string): string {
        return path.join(DATA_DIR, filename);
    }

    ensureDataDir(): void {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    saveAgencies(data: StoredAgencyData): void {
        this.ensureDataDir();
        fs.writeFileSync(this.getFilePath('agencies.json'), JSON.stringify(data, null, 2));
    }

    getAgencies(): StoredAgencyData | null {
        const filePath = this.getFilePath('agencies.json');
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    saveTitleContent(content: StoredTitleContent): void {
        this.ensureDataDir();
        fs.writeFileSync(this.getFilePath(`title-${content.titleNumber}.json`), JSON.stringify(content, null, 2));
    }

    getAllTitleContents(): StoredTitleContent[] {
        const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('title-') && f.endsWith('.json'));
        return files.map(f => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')));
    }

    saveVersionHistory(titleNumber: number, versions: TitleVersion[]): void {
        this.ensureDataDir();
        fs.writeFileSync(this.getFilePath(`versions-${titleNumber}.json`), JSON.stringify({ titleNumber, versions }, null, 2));
    }

    getAllVersionHistories(): { titleNumber: number; versions: TitleVersion[] }[] {
        const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('versions-') && f.endsWith('.json'));
        return files.map(f => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')));
    }

    saveAnalysisCache(data: AnalysisCache): void {
        fs.writeFileSync(this.getFilePath('analysis-cache.json'), JSON.stringify(data, null, 2));
    }

    getAnalysisCache(): AnalysisCache | null {
        const filePath = this.getFilePath('analysis-cache.json');
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    hasData(): boolean {
        return fs.existsSync(this.getFilePath('agencies.json'));
    }
}

export const dataStore = new DataStore();
