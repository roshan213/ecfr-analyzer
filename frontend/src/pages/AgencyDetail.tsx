import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAgencyDetail, AgencyAnalysis, MonthlyChange, METRIC_DEFINITIONS } from '../api';
import { HistoryChart } from '../components/Charts';

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
}

interface Ranking { rank: number | null; total: number }
type Rankings = Record<string, Ranking>;

function MetricCard({ label, value, description, ranking }: { label: string; value: number; description: string; ranking?: Ranking }) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="metric-card" style={{ position: 'relative' }}>
            <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {label}
                <span
                    style={{ cursor: 'help', opacity: 0.6, fontSize: '0.85em' }}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >ⓘ</span>
                {showTooltip && (
                    <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px', padding: '8px', fontSize: '0.8rem',
                        color: 'var(--text-secondary)', zIndex: 10, marginTop: '4px'
                    }}>
                        {description}
                    </div>
                )}
            </div>
            <div className="metric-value">{formatNumber(value)}</div>
            {ranking && ranking.rank && (
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px' }}>
                    #{ranking.rank} of {ranking.total}
                </div>
            )}
        </div>
    );
}

export default function AgencyDetail() {
    const { slug } = useParams<{ slug: string }>();
    const [agency, setAgency] = useState<{ name: string; shortName: string; titles: number[] } | null>(null);
    const [analysis, setAnalysis] = useState<AgencyAnalysis | null>(null);
    const [history, setHistory] = useState<MonthlyChange[]>([]);
    const [rankings, setRankings] = useState<Rankings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        fetchAgencyDetail(slug).then(data => {
            setAgency(data.agency);
            setAnalysis(data.analysis);
            setHistory(data.history || []);
            setRankings(data.rankings);
            setLoading(false);
        });
    }, [slug]);

    if (loading) return <div className="loading"><div className="spinner" /><p>Loading...</p></div>;
    if (!agency) return <div className="error-state"><h2>Agency Not Found</h2></div>;

    return (
        <div>
            <Link to="/agencies" style={{ color: 'var(--text-secondary)' }}>← Back to agencies</Link>

            <div className="section-header" style={{ marginTop: 'var(--space-md)' }}>
                <h2>{agency.name}</h2>
                {agency.shortName && <p>{agency.shortName}</p>}
            </div>

            {analysis ? (
                <>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">Word Count</div>
                            <div className="stat-value">{formatNumber(analysis.wordCount)}</div>
                            {rankings?.wordCount?.rank && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                                    #{rankings.wordCount.rank} of {rankings.wordCount.total}
                                </div>
                            )}
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Sections</div>
                            <div className="stat-value">{formatNumber(analysis.sectionCount)}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Checksum</div>
                            <div className="stat-value" style={{ fontSize: '1.2rem', fontFamily: 'monospace' }}>{analysis.checksum}</div>
                            {analysis.previousChecksum && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '4px' }}>
                                    ⚠️ Changed (was: {analysis.previousChecksum})
                                </div>
                            )}
                        </div>
                    </div>

                    {history.length > 0 && (
                        <div className="card" style={{ marginTop: 'var(--space-xl)' }}>
                            <div className="card-header">
                                <h3 className="card-title">Historical Changes Over Time</h3>
                            </div>
                            <div className="chart-container">
                                <HistoryChart data={history} />
                            </div>
                        </div>
                    )}

                    <div className="card" style={{ marginTop: 'var(--space-xl)' }}>
                        <div className="card-header"><h3 className="card-title">Regulatory Metrics</h3></div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)' }}>
                            <MetricCard label={METRIC_DEFINITIONS.mandateCount.label} value={analysis.mandateCount} description={METRIC_DEFINITIONS.mandateCount.description} ranking={rankings?.mandateCount} />
                            <MetricCard label={METRIC_DEFINITIONS.penaltyCount.label} value={analysis.penaltyCount} description={METRIC_DEFINITIONS.penaltyCount.description} ranking={rankings?.penaltyCount} />
                            <MetricCard label={METRIC_DEFINITIONS.exemptionCount.label} value={analysis.exemptionCount} description={METRIC_DEFINITIONS.exemptionCount.description} ranking={rankings?.exemptionCount} />
                            <MetricCard label={METRIC_DEFINITIONS.definitionCount.label} value={analysis.definitionCount} description={METRIC_DEFINITIONS.definitionCount.description} ranking={rankings?.definitionCount} />
                            <MetricCard label={METRIC_DEFINITIONS.reportingCount.label} value={analysis.reportingCount} description={METRIC_DEFINITIONS.reportingCount.description} ranking={rankings?.reportingCount} />
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
                        <div className="card-header"><h3 className="card-title">CFR Titles</h3></div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                            {analysis.titles.map(t => <span key={t} className="tag">Title {t}</span>)}
                        </div>
                    </div>
                </>
            ) : (
                <div className="card"><p style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>No regulation data</p></div>
            )}
        </div>
    );
}
