import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AgencyWordCount } from '../api';

interface Props {
    data: AgencyWordCount[];
}

const COLORS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6'
];

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
}

export default function WordCountChart({ data }: Props) {
    const chartData = data.map(d => ({
        name: d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name,
        fullName: d.name,
        wordCount: d.wordCount
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <XAxis
                    type="number"
                    tickFormatter={formatNumber}
                    stroke="#6b6b80"
                    fontSize={12}
                />
                <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#6b6b80"
                    fontSize={11}
                    width={100}
                />
                <Tooltip
                    contentStyle={{
                        background: '#1a1a24',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#f0f0f5'
                    }}
                    formatter={(value: number) => [formatNumber(value) + ' words', 'Word Count']}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                />
                <Bar dataKey="wordCount" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
