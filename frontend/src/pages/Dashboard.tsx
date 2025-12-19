import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    fetchSummary,
    fetchWordCounts,
    fetchComplexity,
    fetchHistory,
    AnalysisSummary,
    AgencyWordCount,
    AgencyComplexity,
    MonthlyChange
} from '../api';
import WordCountChart from '../components/WordCountChart';
import HistoryChart from '../components/HistoryChart';
import ComplexityTable from '../components/ComplexityTable';
import { MetricComparisonChart } from '../components/MetricComparisonChart';
import { InfoTooltip, METRIC_DEFINITIONS } from '../components/InfoTooltip';

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Category section component for organized display
function MetricCategorySection({
    title,
    description,
    children
}: {
    title: string;
    description: string;
    children: React.ReactNode
}) {
    return (
        <div style={{ marginTop: 'var(--space-2xl)' }}>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: 600,
                    marginBottom: '4px',
                    color: 'var(--text-primary)'
                }}>
                    {title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {description}
                </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                {children}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [summary, setSummary] = useState<AnalysisSummary | null>(null);
    const [wordCounts, setWordCounts] = useState<AgencyWordCount[]>([]);
    const [complexity, setComplexity] = useState<AgencyComplexity[]>([]);
    const [history, setHistory] = useState<MonthlyChange[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [summaryData, wordCountData, complexityData, historyData] = await Promise.all([
                    fetchSummary(),
                    fetchWordCounts(15),
                    fetchComplexity(100),
                    fetchHistory()
                ]);
                setSummary(summaryData);
                setWordCounts(wordCountData.wordCounts);
                setComplexity(complexityData.complexityRanking);
                setHistory(historyData.monthlyChanges);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner" />
                <p>Loading analysis data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state">
                <h2>Unable to Load Data</h2>
                <p>Please ensure the server is running and data has been downloaded.</p>
                <code>npm run download && npm run dev</code>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="section-header">
                <h2>Federal Regulations Deregulation Dashboard</h2>
                <p>Comprehensive analysis of the Electronic Code of Federal Regulations for policy decisions</p>
            </div>

            {/* Key Stats Grid */}
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
                    <div className="stat-label">Total Word Count</div>
                    <div className="stat-value">{formatNumber(summary?.totalWordCount || 0)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Sections</div>
                    <div className="stat-value">{formatNumber(summary?.totalSections || 0)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">
                        Avg Complexity
                        <InfoTooltip {...METRIC_DEFINITIONS.complexityScore} />
                    </div>
                    <div className="stat-value">{summary?.avgComplexity?.toFixed(1) || '0'}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Last Updated</div>
                    <div className="stat-value" style={{ fontSize: '1rem' }}>
                        {summary?.lastUpdated ? new Date(summary.lastUpdated).toLocaleDateString() : 'N/A'}
                    </div>
                </div>
            </div>

            {/* Volume & History Charts */}
            <div className="two-column">
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Word Count by Agency</h3>
                            <p className="card-subtitle">Top 15 agencies by regulatory volume</p>
                        </div>
                        <Link to="/agencies" className="btn btn-secondary">View All</Link>
                    </div>
                    <div className="chart-container">
                        <WordCountChart data={wordCounts} />
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Regulatory Changes Over Time</h3>
                            <p className="card-subtitle">Monthly amendment activity</p>
                        </div>
                    </div>
                    <div className="chart-container">
                        <HistoryChart data={history} />
                    </div>
                </div>
            </div>

            {/* DEREGULATION ANALYSIS SECTION */}
            <div style={{ marginTop: 'var(--space-2xl)' }}>
                <div className="section-header">
                    <h2>🎯 Deregulation Analysis</h2>
                    <p>Compare agencies by burden metrics — click any bar to view agency details</p>
                </div>

                {/* OVERALL BURDEN SCORES */}
                <MetricCategorySection
                    title="� Overall Burden Scores"
                    description="Top-level metrics for prioritizing which agencies to review first"
                >
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="burdenIndex"
                        title="Regulatory Burden Index (0-100)"
                        formatValue={(v) => `${Math.round(v)}`}
                    />
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="complexityScore"
                        title="Complexity Score (0-10)"
                        formatValue={(v) => v.toFixed(1)}
                    />
                </MetricCategorySection>

                {/* PRESCRIPTIVE BURDEN */}
                <MetricCategorySection
                    title="⚖️ Prescriptive Burden"
                    description="How command-heavy and restrictive the regulations are"
                >
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="mandateDensity"
                        title="Mandate Density (per 1K words)"
                        formatValue={(v) => v.toFixed(2)}
                    />
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="prohibitionDensity"
                        title="Prohibition Density (per 1K words)"
                        formatValue={(v) => v.toFixed(2)}
                    />
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="penaltyScore"
                        title="Penalty & Enforcement Score (0-10)"
                        formatValue={(v) => v.toFixed(1)}
                    />
                </MetricCategorySection>

                {/* ADMINISTRATIVE BURDEN */}
                <MetricCategorySection
                    title="📝 Administrative Burden"
                    description="Paperwork, permits, inspections, and deadline requirements"
                >
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="formReportingBurden"
                        title="Paperwork & Reporting Burden"
                        formatValue={(v) => formatNumber(v)}
                    />
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="permissionBurden"
                        title="Licensing & Permit Requirements"
                        formatValue={(v) => formatNumber(v)}
                    />
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="inspectionBurden"
                        title="Inspection & Audit Requirements"
                        formatValue={(v) => formatNumber(v)}
                    />
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="deadlineCount"
                        title="Deadline & Timing Pressure"
                        formatValue={(v) => formatNumber(v)}
                    />
                </MetricCategorySection>

                {/* COMPLEXITY INDICATORS */}
                <MetricCategorySection
                    title="🔗 Complexity Indicators"
                    description="Structural and language complexity that affects understandability"
                >
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="definitionDensity"
                        title="Technical Definition Density (per 1K words)"
                        formatValue={(v) => v.toFixed(2)}
                    />
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="exemptionCount"
                        title="Exemption & Exception Count"
                        formatValue={(v) => formatNumber(v)}
                    />
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="crossReferenceCount"
                        title="Cross-Reference Complexity"
                        formatValue={(v) => formatNumber(v)}
                    />
                </MetricCategorySection>

                {/* BUSINESS IMPACT */}
                <MetricCategorySection
                    title="💼 Business Impact"
                    description="Direct effects on regulated businesses and flexibility"
                >
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="complianceCostMentions"
                        title="Compliance Cost Language"
                        formatValue={(v) => formatNumber(v)}
                    />
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="discretionaryLanguage"
                        title="Regulatory Flexibility (higher = more flexible)"
                        formatValue={(v) => formatNumber(v)}
                    />
                    <MetricComparisonChart
                        data={complexity}
                        metricKey="smallBusinessMentions"
                        title="Small Business Consideration"
                        formatValue={(v) => v.toString()}
                    />
                </MetricCategorySection>
            </div>

            {/* Complexity Table */}
            <div className="card" style={{ marginTop: 'var(--space-2xl)' }}>
                <div className="card-header">
                    <div>
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center' }}>
                            � Agency Rankings by Complexity
                            <InfoTooltip {...METRIC_DEFINITIONS.complexityScore} />
                        </h3>
                        <p className="card-subtitle">
                            Top agencies ranked by regulatory complexity score
                        </p>
                    </div>
                </div>
                <ComplexityTable data={complexity.slice(0, 15)} />
            </div>
        </div>
    );
}
