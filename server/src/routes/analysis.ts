import { Router } from 'express';
import { dataStore } from '../services/dataStore';
import { analyzer } from '../services/analyzer';

const router = Router();

// GET /api/analysis/summary - Get summary metrics
router.get('/summary', (req, res) => {
    try {
        const analysis = analyzer.getAnalysis();
        res.json(analysis.summary);
    } catch (error: any) {
        res.status(503).json({
            error: 'Analysis not available',
            message: error.message
        });
    }
});

// GET /api/analysis/word-counts - Get word counts for all agencies
router.get('/word-counts', (req, res) => {
    try {
        const analysis = analyzer.getAnalysis();
        const limit = parseInt(req.query.limit as string) || 20;

        const wordCounts = analysis.agencyAnalysis
            .filter(a => a.wordCount > 0)
            .slice(0, limit)
            .map(a => ({
                slug: a.slug,
                name: a.shortName || a.name,
                wordCount: a.wordCount,
                sectionCount: a.sectionCount
            }));

        res.json({ wordCounts });
    } catch (error: any) {
        res.status(503).json({ error: error.message });
    }
});

// GET /api/analysis/checksums - Get checksums for all agencies
router.get('/checksums', (req, res) => {
    try {
        const analysis = analyzer.getAnalysis();

        const checksums = analysis.agencyAnalysis
            .filter(a => a.checksum)
            .map(a => ({
                slug: a.slug,
                name: a.shortName || a.name,
                checksum: a.checksum,
                titleCount: a.titleCount
            }));

        res.json({ checksums });
    } catch (error: any) {
        res.status(503).json({ error: error.message });
    }
});

// GET /api/analysis/complexity - Get complexity scores for all agencies
router.get('/complexity', (req, res) => {
    try {
        const analysis = analyzer.getAnalysis();
        const limit = parseInt(req.query.limit as string) || 20;

        const complexityRanking = analysis.agencyAnalysis
            .filter(a => a.wordCount > 0)
            .sort((a, b) => b.complexityScore - a.complexityScore)
            .slice(0, limit)
            .map(a => ({
                slug: a.slug,
                name: a.shortName || a.name,
                complexityScore: a.complexityScore,
                wordCount: a.wordCount,
                sectionCount: a.sectionCount,
                avgWordsPerSection: a.avgWordsPerSection,
                burdenIndex: a.burdenIndex,
                mandateDensity: a.mandateDensity,
                penaltyScore: a.penaltyScore,
                exemptionCount: a.exemptionCount,
                definitionDensity: a.definitionDensity,
                formReportingBurden: a.formReportingBurden,
                // New policy metrics
                prohibitionDensity: a.prohibitionDensity,
                permissionBurden: a.permissionBurden,
                complianceCostMentions: a.complianceCostMentions,
                inspectionBurden: a.inspectionBurden,
                deadlineCount: a.deadlineCount,
                discretionaryLanguage: a.discretionaryLanguage,
                smallBusinessMentions: a.smallBusinessMentions,
                crossReferenceCount: a.crossReferenceCount
            }));

        res.json({ complexityRanking });
    } catch (error: any) {
        res.status(503).json({ error: error.message });
    }
});

// GET /api/analysis/history - Get historical changes
router.get('/history', (req, res) => {
    try {
        const monthlyChanges = analyzer.getMonthlyChanges();
        res.json({ monthlyChanges });
    } catch (error: any) {
        res.status(503).json({ error: error.message });
    }
});

// GET /api/analysis/all - Get all analysis data
router.get('/all', (req, res) => {
    try {
        const analysis = analyzer.getAnalysis();
        const monthlyChanges = analyzer.getMonthlyChanges();

        res.json({
            summary: analysis.summary,
            agencies: analysis.agencyAnalysis,
            history: monthlyChanges,
            generatedAt: analysis.generatedAt
        });
    } catch (error: any) {
        res.status(503).json({ error: error.message });
    }
});

// POST /api/analysis/refresh - Regenerate analysis cache
router.post('/refresh', (req, res) => {
    try {
        const analysis = analyzer.generateAnalysis();
        res.json({
            message: 'Analysis refreshed successfully',
            summary: analysis.summary,
            generatedAt: analysis.generatedAt
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
