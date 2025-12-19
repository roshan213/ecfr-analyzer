import * as crypto from 'crypto';
import { dataStore, AgencyAnalysis, AnalysisSummary, AnalysisCache, StoredTitleContent, TextMetrics } from './dataStore';

export interface HistoricalChange {
    date: string;
    titleNumber: number;
    titleName: string;
    changeCount: number;
}

export interface MonthlyChanges {
    month: string;
    changeCount: number;
    titlesChanged: number;
}

// Regex patterns for text analysis - Original metrics
const MANDATE_PATTERNS = /\b(shall|must|required|mandatory|obligated|compulsory)\b/gi;
const PENALTY_PATTERNS = /\b(penalty|penalties|fine|fines|violation|violations|enforcement|sanction|sanctions|civil money|criminal|imprisonment)\b/gi;
const EXEMPTION_PATTERNS = /\b(except|exception|exemption|exemptions|waiver|waivers|exclusion|exclusions|unless|notwithstanding)\b/gi;
const DEFINITION_PATTERNS = /\b(means|defined as|the term|definition of|as used in this)\b/gi;
const REPORTING_PATTERNS = /\b(report|reports|reporting|form|forms|submit|submission|filing|filings|disclosure|disclosures|notify|notification|recordkeeping)\b/gi;

// New policy-relevant patterns
const PROHIBITION_PATTERNS = /\b(shall not|must not|may not|prohibited|forbidden|unlawful|illegal)\b/gi;
const PERMISSION_PATTERNS = /\b(permit|permits|license|licenses|licensing|approval|approvals|authorization|authorizations|certificate|certificates|accreditation)\b/gi;
const COMPLIANCE_COST_PATTERNS = /\b(cost|costs|fee|fees|expense|expenses|payment|payments|charge|charges|price|priced)\b/gi;
const INSPECTION_PATTERNS = /\b(inspection|inspections|inspect|audit|audits|auditing|examination|examinations|review|reviews|monitor|monitoring|oversight)\b/gi;
const DEADLINE_PATTERNS = /\b(within \d+ days?|no later than|deadline|deadlines|time limit|time period|promptly|immediately|forthwith)\b/gi;
const DISCRETIONARY_PATTERNS = /\b(may|discretion|discretionary|reasonable|reasonably|appropriate|appropriately|as determined|as deemed)\b/gi;
const SMALL_BUSINESS_PATTERNS = /\b(small business|small businesses|small entity|small entities|small organization|SME|SMEs)\b/gi;
const CROSS_REFERENCE_PATTERNS = /\b(§\s*\d+\.\d+|part \d+|subpart [a-z]|CFR \d+|paragraph \([a-z]\))\b/gi;

class Analyzer {
    /**
     * Analyze text content and extract regulatory metrics
     */
    analyzeText(text: string): TextMetrics {
        // Remove XML tags for clean text analysis
        const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

        return {
            // Original metrics
            mandateCount: (cleanText.match(MANDATE_PATTERNS) || []).length,
            penaltyCount: (cleanText.match(PENALTY_PATTERNS) || []).length,
            exemptionCount: (cleanText.match(EXEMPTION_PATTERNS) || []).length,
            definitionCount: (cleanText.match(DEFINITION_PATTERNS) || []).length,
            reportingCount: (cleanText.match(REPORTING_PATTERNS) || []).length,
            // New policy-relevant metrics
            prohibitionCount: (cleanText.match(PROHIBITION_PATTERNS) || []).length,
            permissionCount: (cleanText.match(PERMISSION_PATTERNS) || []).length,
            complianceCostCount: (cleanText.match(COMPLIANCE_COST_PATTERNS) || []).length,
            inspectionCount: (cleanText.match(INSPECTION_PATTERNS) || []).length,
            deadlineCount: (cleanText.match(DEADLINE_PATTERNS) || []).length,
            discretionaryCount: (cleanText.match(DISCRETIONARY_PATTERNS) || []).length,
            smallBusinessCount: (cleanText.match(SMALL_BUSINESS_PATTERNS) || []).length,
            crossReferenceCount: (cleanText.match(CROSS_REFERENCE_PATTERNS) || []).length
        };
    }

    /**
     * Calculate complexity score based on multiple factors
     */
    calculateComplexityScore(
        wordCount: number,
        sectionCount: number,
        structureDepth: number,
        amendmentCount: number
    ): number {
        const wordScore = Math.min(10, wordCount / 100000);
        const densityScore = sectionCount > 0 ? Math.min(10, (wordCount / sectionCount) / 500) : 0;
        const depthScore = Math.min(10, structureDepth * 1.5);
        const amendmentScore = Math.min(10, amendmentCount / 50);

        const score = (
            wordScore * 0.25 +
            densityScore * 0.25 +
            depthScore * 0.25 +
            amendmentScore * 0.25
        );

        return Math.round(score * 100) / 100;
    }

    /**
     * Calculate Regulatory Burden Index (0-100)
     * Combines word volume, mandate density, reporting burden, and penalty severity
     */
    calculateBurdenIndex(
        wordCount: number,
        mandateCount: number,
        reportingCount: number,
        penaltyCount: number
    ): number {
        // Normalize each component to 0-25 scale
        const volumeScore = Math.min(25, (wordCount / 1000000) * 25);
        const mandateScore = Math.min(25, (mandateCount / wordCount * 1000) * 5);
        const reportingScore = Math.min(25, (reportingCount / wordCount * 1000) * 5);
        const penaltyScore = Math.min(25, (penaltyCount / wordCount * 1000) * 10);

        return Math.round(volumeScore + mandateScore + reportingScore + penaltyScore);
    }

    /**
     * Calculate penalty score (0-10)
     */
    calculatePenaltyScore(penaltyCount: number, wordCount: number): number {
        if (wordCount === 0) return 0;
        const density = (penaltyCount / wordCount) * 10000;
        return Math.min(10, Math.round(density * 10) / 10);
    }

    /**
     * Generate checksum for content
     */
    generateChecksum(content: string): string {
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    }

    /**
     * Count sections in a structure tree
     */
    countSections(node: any): number {
        let count = 0;
        if (node.type === 'section') {
            count = 1;
        }
        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                count += this.countSections(child);
            }
        }
        return count;
    }

    /**
     * Get maximum depth of structure tree
     */
    getStructureDepth(node: any, currentDepth = 0): number {
        if (!node.children || node.children.length === 0) {
            return currentDepth;
        }
        let maxDepth = currentDepth;
        for (const child of node.children) {
            maxDepth = Math.max(maxDepth, this.getStructureDepth(child, currentDepth + 1));
        }
        return maxDepth;
    }

    /**
     * Get the most recent significant update date from versions
     */
    getLastSignificantUpdate(versions: any[]): string {
        if (!versions || versions.length === 0) return '';

        // Filter to substantive changes and sort by date descending
        const substantive = versions
            .filter(v => v.substantive !== false && v.date)
            .sort((a, b) => b.date.localeCompare(a.date));

        return substantive.length > 0 ? substantive[0].date : (versions[0]?.date || '');
    }

    /**
     * Analyze all agencies and generate cached analysis with enhanced metrics
     */
    generateAnalysis(): AnalysisCache {
        const agencyData = dataStore.getAgencies();
        const titleContents = dataStore.getAllTitleContents();
        const versionHistories = dataStore.getAllVersionHistories();

        if (!agencyData) {
            throw new Error('No agency data available. Please run data download first.');
        }

        // Create maps for lookup
        const titleContentMap = new Map<number, StoredTitleContent>();
        for (const content of titleContents) {
            titleContentMap.set(content.titleNumber, content);
        }

        const titleVersionMap = new Map<number, number>();
        const titleLastUpdateMap = new Map<number, string>();
        for (const history of versionHistories) {
            titleVersionMap.set(history.titleNumber, history.versions.length);
            titleLastUpdateMap.set(history.titleNumber, this.getLastSignificantUpdate(history.versions));
        }

        // Analyze each agency
        const agencyAnalyses: AgencyAnalysis[] = [];

        for (const flatAgency of agencyData.flatAgencies) {
            let totalWordCount = 0;
            let totalSectionCount = 0;
            let combinedChecksum = '';
            let totalDepth = 0;
            let totalAmendments = 0;
            let totalMandates = 0;
            let totalPenalties = 0;
            let totalExemptions = 0;
            let totalDefinitions = 0;
            let totalReporting = 0;
            let maxDepth = 0;
            let latestUpdate = '';
            // New policy metrics totals
            let totalProhibitions = 0;
            let totalPermissions = 0;
            let totalComplianceCost = 0;
            let totalInspections = 0;
            let totalDeadlines = 0;
            let totalDiscretionary = 0;
            let totalSmallBusiness = 0;
            let totalCrossReferences = 0;

            for (const titleNum of flatAgency.titles) {
                const content = titleContentMap.get(titleNum);
                if (content) {
                    totalWordCount += content.wordCount;
                    totalSectionCount += content.sectionCount;
                    combinedChecksum += content.xmlChecksum;

                    const depth = content.structureDepth ?? this.getStructureDepth(content.structure);
                    totalDepth += depth;
                    maxDepth = Math.max(maxDepth, depth);

                    totalAmendments += titleVersionMap.get(titleNum) || 0;

                    // Aggregate text metrics if available
                    if (content.textMetrics) {
                        totalMandates += content.textMetrics.mandateCount;
                        totalPenalties += content.textMetrics.penaltyCount;
                        totalExemptions += content.textMetrics.exemptionCount;
                        totalDefinitions += content.textMetrics.definitionCount;
                        totalReporting += content.textMetrics.reportingCount;
                        // New policy metrics
                        totalProhibitions += content.textMetrics.prohibitionCount || 0;
                        totalPermissions += content.textMetrics.permissionCount || 0;
                        totalComplianceCost += content.textMetrics.complianceCostCount || 0;
                        totalInspections += content.textMetrics.inspectionCount || 0;
                        totalDeadlines += content.textMetrics.deadlineCount || 0;
                        totalDiscretionary += content.textMetrics.discretionaryCount || 0;
                        totalSmallBusiness += content.textMetrics.smallBusinessCount || 0;
                        totalCrossReferences += content.textMetrics.crossReferenceCount || 0;
                    }

                    // Track latest update
                    const titleUpdate = content.lastSignificantUpdate || titleLastUpdateMap.get(titleNum) || '';
                    if (titleUpdate > latestUpdate) {
                        latestUpdate = titleUpdate;
                    }
                }
            }

            const avgDepth = flatAgency.titles.length > 0 ? totalDepth / flatAgency.titles.length : 0;

            const complexityScore = this.calculateComplexityScore(
                totalWordCount,
                totalSectionCount,
                avgDepth,
                totalAmendments
            );

            const burdenIndex = this.calculateBurdenIndex(
                totalWordCount,
                totalMandates,
                totalReporting,
                totalPenalties
            );

            agencyAnalyses.push({
                slug: flatAgency.slug,
                name: flatAgency.name,
                shortName: flatAgency.short_name || flatAgency.name,
                wordCount: totalWordCount,
                sectionCount: totalSectionCount,
                titleCount: flatAgency.titles.length,
                checksum: this.generateChecksum(combinedChecksum),
                complexityScore,
                avgWordsPerSection: totalSectionCount > 0 ? Math.round(totalWordCount / totalSectionCount) : 0,
                titles: flatAgency.titles,
                // Deregulation metrics
                burdenIndex,
                mandateDensity: totalWordCount > 0 ? Math.round((totalMandates / totalWordCount) * 1000 * 100) / 100 : 0,
                penaltyScore: this.calculatePenaltyScore(totalPenalties, totalWordCount),
                exemptionCount: totalExemptions,
                definitionDensity: totalWordCount > 0 ? Math.round((totalDefinitions / totalWordCount) * 1000 * 100) / 100 : 0,
                formReportingBurden: totalReporting,
                lastSignificantUpdate: latestUpdate,
                structureDepth: maxDepth,
                // New policy metrics
                prohibitionDensity: totalWordCount > 0 ? Math.round((totalProhibitions / totalWordCount) * 1000 * 100) / 100 : 0,
                permissionBurden: totalPermissions,
                complianceCostMentions: totalComplianceCost,
                inspectionBurden: totalInspections,
                deadlineCount: totalDeadlines,
                discretionaryLanguage: totalDiscretionary,
                smallBusinessMentions: totalSmallBusiness,
                crossReferenceCount: totalCrossReferences
            });
        }

        // Sort by burden index descending (most burdensome first)
        agencyAnalyses.sort((a, b) => b.burdenIndex - a.burdenIndex);

        // Calculate summary
        const summary: AnalysisSummary = {
            totalAgencies: agencyAnalyses.length,
            totalTitles: titleContents.length,
            totalWordCount: agencyAnalyses.reduce((sum, a) => sum + a.wordCount, 0),
            totalSections: agencyAnalyses.reduce((sum, a) => sum + a.sectionCount, 0),
            avgComplexity: agencyAnalyses.length > 0
                ? Math.round((agencyAnalyses.reduce((sum, a) => sum + a.complexityScore, 0) / agencyAnalyses.length) * 100) / 100
                : 0,
            lastUpdated: new Date().toISOString()
        };

        const cache: AnalysisCache = {
            agencyAnalysis: agencyAnalyses,
            summary,
            generatedAt: new Date().toISOString()
        };

        dataStore.saveAnalysisCache(cache);
        return cache;
    }

    /**
     * Get historical changes aggregated by month
     */
    getMonthlyChanges(): MonthlyChanges[] {
        const versionHistories = dataStore.getAllVersionHistories();
        const monthlyMap = new Map<string, { count: number; titles: Set<number> }>();

        for (const history of versionHistories) {
            for (const version of history.versions) {
                if (!version.date) continue;
                const month = version.date.substring(0, 7);
                const existing = monthlyMap.get(month) || { count: 0, titles: new Set() };
                existing.count++;
                existing.titles.add(history.titleNumber);
                monthlyMap.set(month, existing);
            }
        }

        const result: MonthlyChanges[] = [];
        for (const [month, data] of monthlyMap) {
            result.push({
                month,
                changeCount: data.count,
                titlesChanged: data.titles.size
            });
        }

        result.sort((a, b) => a.month.localeCompare(b.month));
        return result.slice(-24);
    }

    /**
     * Get or generate analysis (use cache if available)
     */
    getAnalysis(): AnalysisCache {
        const cached = dataStore.getAnalysisCache();
        if (cached) {
            return cached;
        }
        return this.generateAnalysis();
    }
}

export const analyzer = new Analyzer();
