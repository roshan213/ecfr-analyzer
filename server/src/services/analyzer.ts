import * as crypto from 'crypto';
import { dataStore, AgencyAnalysis, AnalysisCache, MonthlyChange, TextMetrics } from './dataStore';

// Regex patterns for text analysis
const MANDATE_PATTERNS = /\b(shall|must|required|mandatory)\b/gi;
const PENALTY_PATTERNS = /\b(penalty|fine|violation|enforcement|sanction)\b/gi;
const EXEMPTION_PATTERNS = /\b(except|exemption|waiver|exclusion)\b/gi;
const DEFINITION_PATTERNS = /\b(means|defined as|the term)\b/gi;
const REPORTING_PATTERNS = /\b(report|form|submit|filing|disclosure)\b/gi;

class Analyzer {
    analyzeText(text: string): TextMetrics {
        return {
            mandateCount: (text.match(MANDATE_PATTERNS) || []).length,
            penaltyCount: (text.match(PENALTY_PATTERNS) || []).length,
            exemptionCount: (text.match(EXEMPTION_PATTERNS) || []).length,
            definitionCount: (text.match(DEFINITION_PATTERNS) || []).length,
            reportingCount: (text.match(REPORTING_PATTERNS) || []).length
        };
    }

    generateChecksum(content: string): string {
        return crypto.createHash('md5').update(content).digest('hex').substring(0, 8).toUpperCase();
    }

    generateAnalysis(): AnalysisCache {
        const agencies = dataStore.getAgencies();
        const titleContents = dataStore.getAllTitleContents();
        const existingCache = dataStore.getAnalysisCache();
        if (!agencies) throw new Error('No agency data');

        // Build map of previous checksums for change detection
        const previousChecksums = new Map<string, string>();
        if (existingCache) {
            for (const a of existingCache.agencyAnalysis) {
                previousChecksums.set(a.slug, a.checksum);
            }
        }

        const titleMap = new Map<number, any>();
        for (const content of titleContents) titleMap.set(content.titleNumber, content);

        const agencyAnalyses: AgencyAnalysis[] = [];

        for (const agency of agencies.flatAgencies) {
            let totalWords = 0, totalSections = 0, allContent = '';
            let mandates = 0, penalties = 0, exemptions = 0, definitions = 0, reporting = 0;
            const titles: number[] = [];

            for (const titleNum of agency.titles) {
                const content = titleMap.get(titleNum);
                if (content) {
                    totalWords += content.wordCount;
                    totalSections += content.sectionCount;
                    allContent += JSON.stringify(content.structure);
                    titles.push(titleNum);
                    if (content.textMetrics) {
                        mandates += content.textMetrics.mandateCount;
                        penalties += content.textMetrics.penaltyCount;
                        exemptions += content.textMetrics.exemptionCount;
                        definitions += content.textMetrics.definitionCount;
                        reporting += content.textMetrics.reportingCount;
                    }
                }
            }

            const currentChecksum = this.generateChecksum(allContent);
            const previousChecksum = previousChecksums.get(agency.slug);

            agencyAnalyses.push({
                slug: agency.slug, name: agency.name, shortName: agency.short_name,
                wordCount: totalWords, sectionCount: totalSections, titles,
                checksum: currentChecksum,
                previousChecksum: previousChecksum !== currentChecksum ? previousChecksum : undefined,
                mandateCount: mandates, penaltyCount: penalties, exemptionCount: exemptions,
                definitionCount: definitions, reportingCount: reporting
            });
        }

        const summary = {
            totalAgencies: agencyAnalyses.length,
            totalTitles: titleContents.length,
            totalWordCount: agencyAnalyses.reduce((s, a) => s + a.wordCount, 0),
            lastUpdated: new Date().toISOString()
        };

        const cache = { agencyAnalysis: agencyAnalyses, summary, generatedAt: new Date().toISOString() };
        dataStore.saveAnalysisCache(cache);
        return cache;
    }

    getMonthlyChanges(): MonthlyChange[] {
        const histories = dataStore.getAllVersionHistories();
        const monthMap = new Map<string, { count: number; titles: Set<number> }>();

        for (const { titleNumber, versions } of histories) {
            for (const v of versions) {
                const month = v.amendment_date?.substring(0, 7) || v.date?.substring(0, 7);
                if (!month) continue;
                if (!monthMap.has(month)) monthMap.set(month, { count: 0, titles: new Set() });
                const data = monthMap.get(month)!;
                data.count++;
                data.titles.add(titleNumber);
            }
        }

        return Array.from(monthMap.entries())
            .map(([month, data]) => ({ month, changeCount: data.count, titlesChanged: data.titles.size }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-24);
    }

    getAgencyMonthlyChanges(titles: number[]): MonthlyChange[] {
        const histories = dataStore.getAllVersionHistories();
        const monthMap = new Map<string, { count: number; titles: Set<number> }>();
        const titleSet = new Set(titles);

        for (const { titleNumber, versions } of histories) {
            if (!titleSet.has(titleNumber)) continue;
            for (const v of versions) {
                const month = v.amendment_date?.substring(0, 7) || v.date?.substring(0, 7);
                if (!month) continue;
                if (!monthMap.has(month)) monthMap.set(month, { count: 0, titles: new Set() });
                const data = monthMap.get(month)!;
                data.count++;
                data.titles.add(titleNumber);
            }
        }

        return Array.from(monthMap.entries())
            .map(([month, data]) => ({ month, changeCount: data.count, titlesChanged: data.titles.size }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-24);
    }

    getAnalysis(): AnalysisCache {
        const cached = dataStore.getAnalysisCache();
        if (cached) return cached;
        return this.generateAnalysis();
    }
}

export const analyzer = new Analyzer();
