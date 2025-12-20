import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';

interface WordCountProps {
    data: { slug: string; name: string; wordCount: number }[];
}

interface HistoryProps {
    data: { month: string; changeCount: number }[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#fb7185', '#fda4af'];

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
}

export function WordCountChart({ data }: WordCountProps) {
    const chartData = data.map(d => ({
        name: d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name,
        wordCount: d.wordCount
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 30 }}>
                <XAxis type="number" tickFormatter={formatNumber} stroke="#6b6b80" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#6b6b80" fontSize={11} width={100} />
                <Tooltip
                    contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f0f0f5' }}
                    formatter={(value: number) => [formatNumber(value) + ' words', 'Word Count']}
                />
                <Bar dataKey="wordCount" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export function HistoryChart({ data }: HistoryProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                <XAxis dataKey="month" stroke="#6b6b80" fontSize={10} tickFormatter={m => m.slice(5)} />
                <YAxis stroke="#6b6b80" fontSize={12} />
                <Tooltip
                    contentStyle={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f0f0f5' }}
                    formatter={(value: number) => [value + ' changes', 'Amendments']}
                />
                <Line type="monotone" dataKey="changeCount" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}
