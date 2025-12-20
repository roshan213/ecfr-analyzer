/**
 * Download eCFR data - Run with: npx tsx src/scripts/downloadData.ts
 */
import { ecfrClient, Agency } from '../services/ecfrClient';
import { dataStore, TextMetrics } from '../services/dataStore';
import { analyzer } from '../services/analyzer';

// Regex patterns for text analysis
const MANDATE_PATTERNS = /\b(shall|must|required|mandatory)\b/gi;
const PENALTY_PATTERNS = /\b(penalty|fine|violation|enforcement|sanction)\b/gi;
const EXEMPTION_PATTERNS = /\b(except|exemption|waiver|exclusion)\b/gi;
const DEFINITION_PATTERNS = /\b(means|defined as|the term)\b/gi;
const REPORTING_PATTERNS = /\b(report|form|submit|filing|disclosure)\b/gi;

function stripXmlTags(xml: string): string {
    return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countSections(node: any): number {
    if (!node) return 0;
    let count = node.type === 'section' ? 1 : 0;
    if (node.children) {
        for (const child of node.children) count += countSections(child);
    }
    return count;
}

function analyzeText(text: string): TextMetrics {
    return {
        mandateCount: (text.match(MANDATE_PATTERNS) || []).length,
        penaltyCount: (text.match(PENALTY_PATTERNS) || []).length,
        exemptionCount: (text.match(EXEMPTION_PATTERNS) || []).length,
        definitionCount: (text.match(DEFINITION_PATTERNS) || []).length,
        reportingCount: (text.match(REPORTING_PATTERNS) || []).length
    };
}

function flattenAgencies(agencies: Agency[]) {
    const result: any[] = [];
    for (const a of agencies) {
        result.push({ name: a.name, short_name: a.short_name || '', slug: a.slug, titles: a.cfr_references?.map(r => r.title) || [] });
        if (a.children) {
            for (const child of a.children) {
                result.push({ name: child.name, short_name: child.short_name || '', slug: child.slug, titles: child.cfr_references?.map(r => r.title) || [] });
            }
        }
    }
    return result;
}

async function downloadData() {
    console.log('📥 Starting eCFR data download...\n');

    console.log('Fetching agencies...');
    const agencyResponse = await ecfrClient.getAgencies();
    const flatAgencies = flattenAgencies(agencyResponse.agencies);
    dataStore.saveAgencies({ agencies: agencyResponse.agencies, flatAgencies, downloadedAt: new Date().toISOString() });
    console.log(`✅ Saved ${flatAgencies.length} agencies\n`);

    console.log('Fetching titles...');
    const titleResponse = await ecfrClient.getTitles();

    for (const title of titleResponse.titles) {
        console.log(`Processing Title ${title.number}: ${title.name}`);
        try {
            // Get structure for section count
            const structure = await ecfrClient.getTitleStructure(title.up_to_date_as_of, title.number);

            // Get full XML for accurate word count
            const xml = await ecfrClient.getTitleXml(title.up_to_date_as_of, title.number);
            const plainText = stripXmlTags(xml);
            const words = plainText.split(/\s+/).filter(w => w.length > 0);
            const wordCount = words.length;

            // Analyze the text for regulatory metrics
            const textMetrics = analyzeText(plainText);

            dataStore.saveTitleContent({ titleNumber: title.number, structure, wordCount, sectionCount: countSections(structure), textMetrics });

            const versionResponse = await ecfrClient.getTitleVersions(title.number);
            dataStore.saveVersionHistory(title.number, versionResponse.content_versions);

            console.log(`  → ${wordCount.toLocaleString()} words, ${countSections(structure)} sections`);
        } catch (err: any) {
            console.error(`  ⚠️ Failed: ${err.message}`);
        }
    }

    console.log('\n📊 Generating analysis...');
    const analysis = analyzer.generateAnalysis();
    console.log(`✅ Analyzed ${analysis.agencyAnalysis.length} agencies`);
    console.log(`📈 Total: ${analysis.summary.totalWordCount.toLocaleString()} words\n`);
    console.log('✨ Download complete!');
}

downloadData().catch(console.error);
