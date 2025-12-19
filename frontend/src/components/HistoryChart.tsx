import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { MonthlyChange } from '../api';

interface Props {
    data: MonthlyChange[];
}

export default function HistoryChart({ data }: Props) {
    const chartData = data.map(d => ({
        month: d.month,
        displayMonth: new Date(d.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        changes: d.changeCount,
        titles: d.titlesChanged
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorChanges" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="displayMonth"
                    stroke="#6b6b80"
                    fontSize={11}
                    interval="preserveStartEnd"
                />
                <YAxis
                    stroke="#6b6b80"
                    fontSize={12}
                />
                <Tooltip
                    contentStyle={{
                        background: '#1a1a24',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#f0f0f5'
                    }}
                    formatter={(value: number, name: string) => [
                        value,
                        name === 'changes' ? 'Amendments' : 'Titles Changed'
                    ]}
                    labelFormatter={(label) => `Month: ${label}`}
                />
                <Area
                    type="monotone"
                    dataKey="changes"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorChanges)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
