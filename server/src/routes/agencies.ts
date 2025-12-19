import { Router } from 'express';
import { dataStore } from '../services/dataStore';
import { analyzer } from '../services/analyzer';

const router = Router();

// GET /api/agencies - List all agencies
router.get('/', (req, res) => {
    const agencyData = dataStore.getAgencies();

    if (!agencyData) {
        return res.status(503).json({
            error: 'Data not available',
            message: 'Please run the data download script first: npm run download'
        });
    }

    res.json({
        agencies: agencyData.flatAgencies.map(a => ({
            slug: a.slug,
            name: a.name,
            shortName: a.short_name,
            titleCount: a.titles.length,
            titles: a.titles
        })),
        downloadedAt: agencyData.downloadedAt
    });
});

// GET /api/agencies/:slug - Get specific agency details with rankings
router.get('/:slug', (req, res) => {
    const { slug } = req.params;
    const agencyData = dataStore.getAgencies();

    if (!agencyData) {
        return res.status(503).json({ error: 'Data not available' });
    }

    const agency = agencyData.flatAgencies.find(a => a.slug === slug);

    if (!agency) {
        return res.status(404).json({ error: 'Agency not found' });
    }

    // Get analysis for this agency
    const analysisCache = dataStore.getAnalysisCache();
    const agencyAnalysis = analysisCache?.agencyAnalysis.find(a => a.slug === slug);

    // Compute rankings for each metric if we have analysis data
    let rankings: Record<string, { rank: number; total: number }> | null = null;

    if (analysisCache && agencyAnalysis) {
        const allAgencies = analysisCache.agencyAnalysis.filter(a => a.wordCount > 0);
        const total = allAgencies.length;

        // Helper to compute rank (1 = highest value)
        const getRank = (metric: keyof typeof agencyAnalysis, descending = true) => {
            const sorted = [...allAgencies].sort((a, b) =>
                descending
                    ? (b[metric] as number) - (a[metric] as number)
                    : (a[metric] as number) - (b[metric] as number)
            );
            return sorted.findIndex(a => a.slug === slug) + 1;
        };

        rankings = {
            // Burden metrics (higher = worse, so rank by descending)
            burdenIndex: { rank: getRank('burdenIndex'), total },
            mandateDensity: { rank: getRank('mandateDensity'), total },
            penaltyScore: { rank: getRank('penaltyScore'), total },
            exemptionCount: { rank: getRank('exemptionCount'), total },
            definitionDensity: { rank: getRank('definitionDensity'), total },
            formReportingBurden: { rank: getRank('formReportingBurden'), total },
            complexityScore: { rank: getRank('complexityScore'), total },
            structureDepth: { rank: getRank('structureDepth'), total },
            // New policy metrics
            prohibitionDensity: { rank: getRank('prohibitionDensity'), total },
            permissionBurden: { rank: getRank('permissionBurden'), total },
            complianceCostMentions: { rank: getRank('complianceCostMentions'), total },
            inspectionBurden: { rank: getRank('inspectionBurden'), total },
            deadlineCount: { rank: getRank('deadlineCount'), total },
            discretionaryLanguage: { rank: getRank('discretionaryLanguage'), total },
            smallBusinessMentions: { rank: getRank('smallBusinessMentions'), total },
            crossReferenceCount: { rank: getRank('crossReferenceCount'), total },
            // Basic metrics
            wordCount: { rank: getRank('wordCount'), total },
            sectionCount: { rank: getRank('sectionCount'), total }
        };
    }

    res.json({
        agency: {
            slug: agency.slug,
            name: agency.name,
            shortName: agency.short_name,
            titles: agency.titles,
            chapters: agency.chapters,
            parentSlug: agency.parentSlug
        },
        analysis: agencyAnalysis || null,
        rankings
    });
});

// GET /api/agencies/:slug/analysis - Get analysis for specific agency
router.get('/:slug/analysis', (req, res) => {
    const { slug } = req.params;

    try {
        const analysis = analyzer.getAnalysis();
        const agencyAnalysis = analysis.agencyAnalysis.find(a => a.slug === slug);

        if (!agencyAnalysis) {
            return res.status(404).json({ error: 'Agency not found in analysis' });
        }

        res.json(agencyAnalysis);
    } catch (error: any) {
        res.status(503).json({ error: error.message });
    }
});

export default router;
