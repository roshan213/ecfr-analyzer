import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAgencyDetail, AgencyAnalysis } from '../api';
import { InfoTooltip, METRIC_DEFINITIONS } from '../components/InfoTooltip';

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
}

function getComplexityClass(score: number): string {
    if (score < 3) return 'low';
    if (score < 6) return 'medium';
    return 'high';
}

function getComplexityLabel(score: number): string {
    if (score < 3) return 'Low';
    if (score < 6) return 'Moderate';
    return 'High';
}

interface Rankings {
    [key: string]: { rank: number; total: number };
}

// Metric card component with tooltip and ranking
function MetricCard({
    label,
    value,
    subtitle,
    metricKey,
    rankings,
    colorValue = false,
    highThreshold = 0,
    midThreshold = 0,
    inverse = false
}: {
    label: string;
    value: string | number;
    subtitle: string;
    metricKey: string;
    rankings: Rankings | null;
    colorValue?: boolean;
    highThreshold?: number;
    midThreshold?: number;
    inverse?: boolean;
}) {
    const metricDef = METRIC_DEFINITIONS[metricKey as keyof typeof METRIC_DEFINITIONS];
    const ranking = rankings?.[metricKey];
    const numValue = typeof value === 'number' ? value : parseFloat(value);

    // Determine color based on thresholds
    let valueColor = 'var(--text-primary)';
    if (colorValue && !isNaN(numValue)) {
        if (inverse) {
            // For inverse metrics like discretionary (higher = better)
            if (numValue >= highThreshold) valueColor = 'var(--success)';
            else if (numValue >= midThreshold) valueColor = 'var(--warning)';
            else valueColor = 'var(--danger)';
        } else {
            if (numValue >= highThreshold) valueColor = 'var(--danger)';
            else if (numValue >= midThreshold) valueColor = 'var(--warning)';
            else valueColor = 'var(--success)';
        }
    }

    // Ranking badge color
    let rankBg = 'rgba(255,255,255,0.1)';
    let rankColor = 'var(--text-secondary)';
    if (ranking) {
        if (ranking.rank <= 10) {
            rankBg = 'rgba(239, 68, 68, 0.2)';
            rankColor = '#ef4444';
        } else if (ranking.rank > ranking.total - 10) {
            rankBg = 'rgba(34, 197, 94, 0.2)';
            rankColor = '#22c55e';
        }
    }

    return (
        <div style={{
            padding: 'var(--space-md)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            position: 'relative'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}>
                {label}
                {metricDef && (
                    <InfoTooltip
                        title={metricDef.title}
                        calculation={metricDef.calculation}
                        helpfulness={metricDef.helpfulness}
                    />
                )}
            </div>
            <div style={{
                fontSize: '1.6rem',
                fontWeight: 700,
                color: valueColor
            }}>
                {value}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{subtitle}</div>
            {ranking && (
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    background: rankBg,
                    color: rankColor,
                    borderRadius: '4px',
                    fontWeight: 600
                }}>
                    #{ranking.rank}/{ranking.total}
                </div>
            )}
        </div>
    );
}

// Category section component
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
        <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
            <div className="card-header">
                <div>
                    <h3 className="card-title">{title}</h3>
                    <p className="card-subtitle">{description}</p>
                </div>
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 'var(--space-md)'
            }}>
                {children}
            </div>
        </div>
    );
}

export default function AgencyDetail() {
    const { slug } = useParams<{ slug: string }>();
    const [agency, setAgency] = useState<{ name: string; shortName: string; titles: number[] } | null>(null);
    const [analysis, setAnalysis] = useState<AgencyAnalysis | null>(null);
    const [rankings, setRankings] = useState<Rankings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            if (!slug) return;
            try {
                const data = await fetchAgencyDetail(slug);
                setAgency(data.agency);
                setAnalysis(data.analysis);
                setRankings(data.rankings || null);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [slug]);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner" />
                <p>Loading agency details...</p>
            </div>
        );
    }

    if (error || !agency) {
        return (
            <div className="error-state">
                <h2>Agency Not Found</h2>
                <p>{error || 'The requested agency could not be found.'}</p>
                <Link to="/agencies" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }}>
                    Back to Agencies
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
                <Link to="/agencies" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    ← Back to Agencies
                </Link>
            </div>

            <div className="section-header">
                <h2>{agency.name}</h2>
                {agency.shortName && <p>{agency.shortName}</p>}
            </div>

            {analysis ? (
                <>
                    {/* Basic Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">Word Count</div>
                            <div className="stat-value">{formatNumber(analysis.wordCount)}</div>
                            {rankings?.wordCount && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Rank #{rankings.wordCount.rank} of {rankings.wordCount.total}
                                </div>
                            )}
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Total Sections</div>
                            <div className="stat-value">{formatNumber(analysis.sectionCount)}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">CFR Titles</div>
                            <div className="stat-value">{analysis.titleCount}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Last Updated</div>
                            <div className="stat-value" style={{ fontSize: '1rem' }}>
                                {analysis.lastSignificantUpdate
                                    ? new Date(analysis.lastSignificantUpdate).toLocaleDateString()
                                    : 'N/A'}
                            </div>
                        </div>
                    </div>

                    {/* Complexity Score Highlight */}
                    <div className="two-column">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center' }}>
                                    📊 Burden Index
                                    <InfoTooltip {...METRIC_DEFINITIONS.burdenIndex} />
                                </h3>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                                <div style={{
                                    fontSize: '3.5rem',
                                    fontWeight: 700,
                                    background: analysis.burdenIndex >= 50 ? 'linear-gradient(135deg, #ef4444, #f97316)' :
                                        analysis.burdenIndex >= 25 ? 'linear-gradient(135deg, #f59e0b, #eab308)' :
                                            'linear-gradient(135deg, #22c55e, #10b981)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}>
                                    {analysis.burdenIndex}/100
                                </div>
                                {rankings?.burdenIndex && (
                                    <div style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>
                                        Ranked <strong>#{rankings.burdenIndex.rank}</strong> of {rankings.burdenIndex.total} agencies
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center' }}>
                                    🎯 Complexity Score
                                    <InfoTooltip {...METRIC_DEFINITIONS.complexityScore} />
                                </h3>
                            </div>
                            <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
                                <div style={{
                                    fontSize: '3.5rem',
                                    fontWeight: 700,
                                    background: analysis.complexityScore >= 6 ? 'linear-gradient(135deg, #ef4444, #f97316)' :
                                        analysis.complexityScore >= 3 ? 'linear-gradient(135deg, #f59e0b, #eab308)' :
                                            'linear-gradient(135deg, #22c55e, #10b981)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}>
                                    {analysis.complexityScore.toFixed(1)}/10
                                </div>
                                <span className={`complexity-badge ${getComplexityClass(analysis.complexityScore)}`}>
                                    {getComplexityLabel(analysis.complexityScore)} Complexity
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* PRESCRIPTIVE BURDEN */}
                    <MetricCategorySection
                        title="⚖️ Prescriptive Burden"
                        description="How command-heavy and restrictive the regulations are"
                    >
                        <MetricCard
                            label="Mandate Density"
                            value={analysis.mandateDensity.toFixed(2)}
                            subtitle="Per 1,000 words"
                            metricKey="mandateDensity"
                            rankings={rankings}
                        />
                        <MetricCard
                            label="Prohibition Density"
                            value={(analysis.prohibitionDensity || 0).toFixed(2)}
                            subtitle="Per 1,000 words"
                            metricKey="prohibitionDensity"
                            rankings={rankings}
                        />
                        <MetricCard
                            label="Penalty Score"
                            value={`${analysis.penaltyScore.toFixed(1)}/10`}
                            subtitle="Enforcement intensity"
                            metricKey="penaltyScore"
                            rankings={rankings}
                            colorValue={true}
                            highThreshold={5}
                            midThreshold={2}
                        />
                    </MetricCategorySection>

                    {/* ADMINISTRATIVE BURDEN */}
                    <MetricCategorySection
                        title="📝 Administrative Burden"
                        description="Paperwork, permits, inspections, and deadline requirements"
                    >
                        <MetricCard
                            label="Paperwork Burden"
                            value={formatNumber(analysis.formReportingBurden)}
                            subtitle="Form/filing requirements"
                            metricKey="formReportingBurden"
                            rankings={rankings}
                        />
                        <MetricCard
                            label="Permit Requirements"
                            value={formatNumber(analysis.permissionBurden || 0)}
                            subtitle="License/approval terms"
                            metricKey="permissionBurden"
                            rankings={rankings}
                        />
                        <MetricCard
                            label="Inspection Burden"
                            value={formatNumber(analysis.inspectionBurden || 0)}
                            subtitle="Audit/monitoring terms"
                            metricKey="inspectionBurden"
                            rankings={rankings}
                        />
                        <MetricCard
                            label="Deadline Pressure"
                            value={formatNumber(analysis.deadlineCount || 0)}
                            subtitle="Timing requirements"
                            metricKey="deadlineCount"
                            rankings={rankings}
                        />
                    </MetricCategorySection>

                    {/* COMPLEXITY INDICATORS */}
                    <MetricCategorySection
                        title="🔗 Complexity Indicators"
                        description="Structural and language complexity that affects understandability"
                    >
                        <MetricCard
                            label="Definition Density"
                            value={analysis.definitionDensity.toFixed(2)}
                            subtitle="Per 1,000 words"
                            metricKey="definitionDensity"
                            rankings={rankings}
                        />
                        <MetricCard
                            label="Exemptions"
                            value={formatNumber(analysis.exemptionCount)}
                            subtitle="Exception clauses"
                            metricKey="exemptionCount"
                            rankings={rankings}
                        />
                        <MetricCard
                            label="Structure Depth"
                            value={analysis.structureDepth}
                            subtitle="Max nesting levels"
                            metricKey="structureDepth"
                            rankings={rankings}
                        />
                        <MetricCard
                            label="Cross-References"
                            value={formatNumber(analysis.crossReferenceCount || 0)}
                            subtitle="Internal CFR links"
                            metricKey="crossReferenceCount"
                            rankings={rankings}
                        />
                    </MetricCategorySection>

                    {/* BUSINESS IMPACT */}
                    <MetricCategorySection
                        title="💼 Business Impact"
                        description="Direct effects on regulated businesses and flexibility"
                    >
                        <MetricCard
                            label="Compliance Cost"
                            value={formatNumber(analysis.complianceCostMentions || 0)}
                            subtitle="Cost/fee language"
                            metricKey="complianceCostMentions"
                            rankings={rankings}
                        />
                        <MetricCard
                            label="Flexibility Index"
                            value={formatNumber(analysis.discretionaryLanguage || 0)}
                            subtitle="Higher = more flexible"
                            metricKey="discretionaryLanguage"
                            rankings={rankings}
                            colorValue={true}
                            inverse={true}
                            highThreshold={1000}
                            midThreshold={100}
                        />
                        <MetricCard
                            label="Small Business"
                            value={analysis.smallBusinessMentions || 0}
                            subtitle="SMB mentions"
                            metricKey="smallBusinessMentions"
                            rankings={rankings}
                        />
                    </MetricCategorySection>

                    {/* CFR Titles */}
                    <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
                        <div className="card-header">
                            <h3 className="card-title">📚 CFR Titles</h3>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                            {analysis.titles.map(titleNum => (
                                <span key={titleNum} style={{
                                    padding: 'var(--space-sm) var(--space-md)',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.9rem'
                                }}>
                                    Title {titleNum}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Checksum */}
                    <div className="card" style={{ marginTop: 'var(--space-lg)' }}>
                        <div className="card-header">
                            <h3 className="card-title">🔐 Content Checksum</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <code style={{
                                fontSize: '1.2rem',
                                background: 'var(--bg-primary)',
                                padding: 'var(--space-sm) var(--space-md)',
                                borderRadius: 'var(--radius-sm)',
                                fontFamily: 'monospace',
                                letterSpacing: '2px'
                            }}>
                                {analysis.checksum}
                            </code>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Changes when regulatory content is modified
                            </span>
                        </div>
                    </div>
                </>
            ) : (
                <div className="card">
                    <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-secondary)' }}>
                        <p>No analysis data available for this agency.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: 'var(--space-md)' }}>
                            This agency may not have any direct CFR references.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
