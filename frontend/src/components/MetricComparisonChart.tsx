import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { AgencyComplexity } from '../api';
import { InfoTooltip, METRIC_DEFINITIONS } from './InfoTooltip';

interface MetricChartProps {
    data: AgencyComplexity[];
    metricKey: keyof AgencyComplexity;
    title: string;
    showTooltip?: boolean;
    formatValue?: (val: number) => string;
}

export function MetricComparisonChart({
    data,
    metricKey,
    title,
    showTooltip = true,
    formatValue = (v) => v.toLocaleString()
}: MetricChartProps) {
    const navigate = useNavigate();

    // Sort and get 10 worst (highest) and 10 best (lowest with value > 0)
    const sorted = [...data]
        .filter(d => (d[metricKey] as number) > 0)
        .sort((a, b) => (b[metricKey] as number) - (a[metricKey] as number));

    const worst10 = sorted.slice(0, 10);
    const best10 = sorted.slice(-10).reverse();

    const metricDef = METRIC_DEFINITIONS[metricKey as keyof typeof METRIC_DEFINITIONS];

    const handleBarClick = (data: any) => {
        if (data?.slug) {
            navigate(`/agencies/${data.slug}`);
        }
    };

    const CustomTooltipContent = ({ active, payload }: any) => {
        if (active && payload?.[0]) {
            const item = payload[0].payload;
            return (
                <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '12px'
                }}>
                    <div style={{ fontWeight: 600 }}>{item.fullName}</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {title}: <strong>{formatValue(item.value)}</strong>
                    </div>
                    <div style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', marginTop: '4px' }}>
                        Click to view details →
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderChart = (chartData: any[], label: string, chartColor: string) => (
        <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                marginBottom: '8px',
                fontWeight: 600
            }}>
                {label}
            </div>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltipContent />} />
                    <Bar
                        dataKey="value"
                        radius={[0, 4, 4, 0]}
                        onClick={handleBarClick}
                        style={{ cursor: 'pointer' }}
                    >
                        {chartData.map((_, index) => (
                            <Cell key={index} fill={chartColor} fillOpacity={0.9 - index * 0.05} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );

    const worstData = worst10.map(d => ({
        name: d.name.length > 12 ? d.name.slice(0, 12) + '...' : d.name,
        fullName: d.name,
        value: d[metricKey] as number,
        slug: d.slug
    }));

    const bestData = best10.map(d => ({
        name: d.name.length > 12 ? d.name.slice(0, 12) + '...' : d.name,
        fullName: d.name,
        value: d[metricKey] as number,
        slug: d.slug
    }));

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center' }}>
                    {title}
                    {showTooltip && metricDef && (
                        <InfoTooltip
                            title={metricDef.title}
                            calculation={metricDef.calculation}
                            helpfulness={metricDef.helpfulness}
                        />
                    )}
                </h3>
            </div>
            <div style={{
                display: 'flex',
                gap: 'var(--space-xl)',
                flexWrap: 'wrap'
            }}>
                {renderChart(worstData, '🔴 Top 10 Highest (Needs Review)', '#ef4444')}
                {renderChart(bestData, '🟢 Top 10 Lowest (Best Performing)', '#22c55e')}
            </div>
        </div>
    );
}
