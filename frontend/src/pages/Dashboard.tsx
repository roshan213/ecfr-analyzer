import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSummary, fetchWordCounts, fetchHistory, AnalysisSummary, MonthlyChange } from '../api';
import { WordCountChart, HistoryChart } from '../components/Charts';

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

export default function Dashboard() {
    const [summary, setSummary] = useState<AnalysisSummary | null>(null);
    const [wordCounts, setWordCounts] = useState<any[]>([]);
    const [history, setHistory] = useState<MonthlyChange[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [s, w, h] = await Promise.all([
                    fetchSummary(),
                    fetchWordCounts(15),
                    fetchHistory()
                ]);
                setSummary(s);
                setWordCounts(w.wordCounts);
                setHistory(h.monthlyChanges);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <div className="loading"><div className="spinner" /><p>Loading...</p></div>;

    return (
        <div>
            <div className="section-header">
                <h2>eCFR Analysis Dashboard</h2>
                <p>Word counts per agency, historical changes, and checksums</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Agencies</div>
                    <div className="stat-value">{summary?.totalAgencies || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">CFR Titles</div>
                    <div className="stat-value">{summary?.totalTitles || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Words</div>
                    <div className="stat-value">{formatNumber(summary?.totalWordCount || 0)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Last Updated</div>
                    <div className="stat-value" style={{ fontSize: '1rem' }}>
                        {summary?.lastUpdated ? new Date(summary.lastUpdated).toLocaleDateString() : 'N/A'}
                    </div>
                </div>
            </div>

            <div className="two-column">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Word Count by Agency</h3>
                        <Link to="/agencies" className="btn btn-secondary">View All</Link>
                    </div>
                    <div className="chart-container">
                        <WordCountChart data={wordCounts} />
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Historical Changes Over Time</h3>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Last 24 months</span>
                    </div>
                    <div className="chart-container">
                        <HistoryChart data={history} />
                    </div>
                </div>
            </div>
        </div>
    );
}
