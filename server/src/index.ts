import express from 'express';
import cors from 'cors';
import agenciesRouter from './routes/agencies';
import analysisRouter from './routes/analysis';
import { dataStore } from './services/dataStore';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/agencies', agenciesRouter);
app.use('/api/analysis', analysisRouter);

// Health check
app.get('/api/health', (req, res) => {
    const hasData = dataStore.hasData();
    res.json({
        status: 'ok',
        dataAvailable: hasData,
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'eCFR Analysis API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            agencies: '/api/agencies',
            agencyDetail: '/api/agencies/:slug',
            summary: '/api/analysis/summary',
            wordCounts: '/api/analysis/word-counts',
            checksums: '/api/analysis/checksums',
            complexity: '/api/analysis/complexity',
            history: '/api/analysis/history',
            all: '/api/analysis/all'
        }
    });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`\n🚀 eCFR Analysis Server running on http://localhost:${PORT}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET  /api/health          - Health check`);
    console.log(`  GET  /api/agencies        - List all agencies`);
    console.log(`  GET  /api/agencies/:slug  - Get agency details`);
    console.log(`  GET  /api/analysis/summary    - Summary metrics`);
    console.log(`  GET  /api/analysis/word-counts - Word counts by agency`);
    console.log(`  GET  /api/analysis/checksums  - Checksums by agency`);
    console.log(`  GET  /api/analysis/complexity - Complexity scores`);
    console.log(`  GET  /api/analysis/history    - Historical changes`);
    console.log(`  POST /api/analysis/refresh    - Refresh analysis cache`);

    if (!dataStore.hasData()) {
        console.log(`\n⚠️  No data found. Run 'npm run download' to fetch eCFR data.`);
    }
});
