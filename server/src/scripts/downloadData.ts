import { ecfrClient, Agency } from '../services/ecfrClient';
import { dataStore, FlatAgency, StoredAgencyData, StoredTitleData, StoredTitleContent } from '../services/dataStore';
import { analyzer } from '../services/analyzer';
import * as crypto from 'crypto';

const RATE_LIMIT_DELAY = 500; // ms between requests

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function flattenAgencies(agencies: Agency[], parentSlug?: string): FlatAgency[] {
    const result: FlatAgency[] = [];

    for (const agency of agencies) {
        const titles = agency.cfr_references?.map(ref => ref.title) || [];
        const chapters = agency.cfr_references?.map(ref => ref.chapter) || [];

        result.push({
            name: agency.name,
            short_name: agency.short_name || '',
            slug: agency.slug,
            titles: [...new Set(titles)],
            chapters: [...new Set(chapters)],
            parentSlug
        });

        if (agency.children && agency.children.length > 0) {
            result.push(...flattenAgencies(agency.children, agency.slug));
        }
    }

    return result;
}

function countWords(xml: string): number {
    // Remove XML tags and count words
    const text = xml.replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text.split(' ').filter(w => w.length > 0).length;
}

async function downloadAgencies(): Promise<StoredAgencyData> {
    console.log('📥 Downloading agencies...');
    const response = await ecfrClient.getAgencies();
    const flatAgencies = flattenAgencies(response.agencies);

    const data: StoredAgencyData = {
        agencies: response.agencies,
        flatAgencies,
        downloadedAt: new Date().toISOString()
    };

    dataStore.saveAgencies(data);
    console.log(`✅ Downloaded ${response.agencies.length} agencies (${flatAgencies.length} including children)`);
    return data;
}

async function downloadTitles(): Promise<StoredTitleData> {
    console.log('📥 Downloading titles...');
    const response = await ecfrClient.getTitles();

    const data: StoredTitleData = {
        titles: response.titles,
        downloadedAt: new Date().toISOString()
    };

    dataStore.saveTitles(data);
    console.log(`✅ Downloaded ${response.titles.length} titles`);
    return data;
}

async function downloadTitleContent(titleNumber: number, date: string): Promise<StoredTitleContent | null> {
    console.log(`  📄 Downloading title ${titleNumber}...`);

    try {
        // Get structure
        const structure = await ecfrClient.getTitleStructure(date, titleNumber);
        await sleep(RATE_LIMIT_DELAY);

        // Get versions
        const versionsResponse = await ecfrClient.getTitleVersions(titleNumber);
        await sleep(RATE_LIMIT_DELAY);

        // Save versions separately
        const versions = versionsResponse.content_versions || [];
        dataStore.saveVersionHistory(titleNumber, versions);

        // Get XML content (this is the large download)
        let xml = '';
        let xmlSize = 0;
        let wordCount = 0;
        let xmlChecksum = '';
        let textMetrics = {
            mandateCount: 0,
            penaltyCount: 0,
            exemptionCount: 0,
            definitionCount: 0,
            reportingCount: 0,
            prohibitionCount: 0,
            permissionCount: 0,
            complianceCostCount: 0,
            inspectionCount: 0,
            deadlineCount: 0,
            discretionaryCount: 0,
            smallBusinessCount: 0,
            crossReferenceCount: 0
        };

        try {
            xml = await ecfrClient.getTitleXml(date, titleNumber);
            xmlSize = Buffer.byteLength(xml, 'utf-8');
            wordCount = countWords(xml);
            xmlChecksum = crypto.createHash('sha256').update(xml).digest('hex').substring(0, 16);

            // Extract text metrics from XML content
            textMetrics = analyzer.analyzeText(xml);
        } catch (xmlError) {
            console.log(`    ⚠️ Could not download XML for title ${titleNumber}, using structure only`);
        }

        const sectionCount = analyzer.countSections(structure);
        const structureDepth = analyzer.getStructureDepth(structure);

        // Get last significant update from versions
        const substantiveVersions = versions
            .filter(v => v.substantive !== false && v.date)
            .sort((a, b) => b.date.localeCompare(a.date));
        const lastSignificantUpdate = substantiveVersions.length > 0
            ? substantiveVersions[0].date
            : (versions[0]?.date || '');

        const content: StoredTitleContent = {
            titleNumber,
            structure,
            versions,
            wordCount,
            sectionCount,
            xmlSize,
            xmlChecksum,
            downloadedAt: new Date().toISOString(),
            textMetrics,
            structureDepth,
            lastSignificantUpdate
        };

        dataStore.saveTitleContent(titleNumber, content);

        const mandates = textMetrics.mandateCount;
        const penalties = textMetrics.penaltyCount;
        console.log(`    ✅ Title ${titleNumber}: ${wordCount.toLocaleString()} words, ${sectionCount} sections, ${mandates} mandates, ${penalties} penalties`);

        return content;
    } catch (error: any) {
        console.error(`    ❌ Error downloading title ${titleNumber}: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('🚀 Starting eCFR data download\n');
    console.log('='.repeat(50));

    try {
        // Download agencies
        await downloadAgencies();
        await sleep(RATE_LIMIT_DELAY);

        // Download titles
        const titlesData = await downloadTitles();
        await sleep(RATE_LIMIT_DELAY);

        // Download content for each non-reserved title
        console.log('\n📥 Downloading title contents...');
        const activeTitles = titlesData.titles.filter(t => !t.reserved);
        console.log(`   Found ${activeTitles.length} active titles\n`);

        let successCount = 0;
        for (const title of activeTitles) {
            // Use the title's up_to_date_as_of date for API calls
            const titleDate = title.up_to_date_as_of || title.latest_issue_date;
            const result = await downloadTitleContent(title.number, titleDate);
            if (result) successCount++;
            await sleep(RATE_LIMIT_DELAY);
        }

        // Generate analysis cache
        console.log('\n📊 Generating analysis cache...');
        const analysis = analyzer.generateAnalysis();
        console.log(`✅ Analysis complete: ${analysis.summary.totalAgencies} agencies, ${analysis.summary.totalWordCount.toLocaleString()} total words`);

        console.log('\n' + '='.repeat(50));
        console.log('✨ Download complete!');
        console.log(`   - ${successCount}/${activeTitles.length} titles downloaded`);
        console.log(`   - Data stored in server/data/`);

    } catch (error: any) {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    }
}

main();
