import express from 'express';
import cors from 'cors';
import { dataStore } from './services/dataStore';
import { analyzer } from './services/analyzer';

const app = express();
app.use(cors());
app.use(express.json());

// Summary endpoint
app.get('/api/analysis/summary', (req, res) => {
    const cache = analyzer.getAnalysis();
    res.json(cache.summary);
});

// Word counts endpoint
app.get('/api/analysis/word-counts', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 15;
    const cache = analyzer.getAnalysis();
    const wordCounts = cache.agencyAnalysis
        .filter(a => a.wordCount > 0)
        .sort((a, b) => b.wordCount - a.wordCount)
        .slice(0, limit)
        .map(a => ({ slug: a.slug, name: a.shortName || a.name, wordCount: a.wordCount }));
    res.json({ wordCounts });
});

// Historical changes endpoint
app.get('/api/analysis/history', (req, res) => {
    const monthlyChanges = analyzer.getMonthlyChanges();
    res.json({ monthlyChanges });
});

// Agencies list with checksums
app.get('/api/agencies', (req, res) => {
    const data = dataStore.getAgencies();
    const cache = analyzer.getAnalysis();
    if (!data) return res.status(404).json({ error: 'No data' });

    const agencies = data.flatAgencies.map(a => {
        const analysis = cache.agencyAnalysis.find(x => x.slug === a.slug);
        return {
            slug: a.slug,
            name: a.name,
            shortName: a.short_name,
            wordCount: analysis?.wordCount || 0,
            checksum: analysis?.checksum || '-'
        };
    });
    res.json({ agencies });
});

// Agency detail with rankings
app.get('/api/agencies/:slug', (req, res) => {
    const { slug } = req.params;
    const data = dataStore.getAgencies();
    const cache = analyzer.getAnalysis();
    if (!data) return res.status(404).json({ error: 'No data' });

    const agency = data.flatAgencies.find(a => a.slug === slug);
    if (!agency) return res.status(404).json({ error: 'Agency not found' });

    const analysis = cache.agencyAnalysis.find(a => a.slug === slug);
    const history = analysis ? analyzer.getAgencyMonthlyChanges(analysis.titles) : [];

    // Calculate rankings for each metric (only agencies with data)
    const withData = cache.agencyAnalysis.filter(a => a.wordCount > 0);
    const total = withData.length;

    const getRank = (key: string) => {
        if (!analysis) return null;
        const sorted = [...withData].sort((a, b) => (b as any)[key] - (a as any)[key]);
        return sorted.findIndex(a => a.slug === slug) + 1;
    };

    const rankings = analysis ? {
        wordCount: { rank: getRank('wordCount'), total },
        mandateCount: { rank: getRank('mandateCount'), total },
        penaltyCount: { rank: getRank('penaltyCount'), total },
        exemptionCount: { rank: getRank('exemptionCount'), total },
        definitionCount: { rank: getRank('definitionCount'), total },
        reportingCount: { rank: getRank('reportingCount'), total }
    } : null;

    res.json({
        agency: { name: agency.name, shortName: agency.short_name, titles: agency.titles },
        analysis: analysis || null,
        history,
        rankings
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
