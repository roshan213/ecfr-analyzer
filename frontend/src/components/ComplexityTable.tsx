import { Link } from 'react-router-dom';
import { AgencyComplexity } from '../api';

interface Props {
    data: AgencyComplexity[];
}

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

export default function ComplexityTable({ data }: Props) {
    return (
        <table className="data-table">
            <thead>
                <tr>
                    <th style={{ width: '50px' }}>Rank</th>
                    <th>Agency</th>
                    <th>Complexity Score</th>
                    <th>Word Count</th>
                    <th>Sections</th>
                    <th>Avg Words/Section</th>
                </tr>
            </thead>
            <tbody>
                {data.map((agency, index) => (
                    <tr key={agency.slug}>
                        <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>#{index + 1}</td>
                        <td>
                            <Link
                                to={`/agencies/${agency.slug}`}
                                style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                            >
                                {agency.name}
                            </Link>
                        </td>
                        <td>
                            <span className={`complexity-badge ${getComplexityClass(agency.complexityScore)}`}>
                                {agency.complexityScore.toFixed(1)}
                            </span>
                        </td>
                        <td>{formatNumber(agency.wordCount)}</td>
                        <td>{formatNumber(agency.sectionCount)}</td>
                        <td>{formatNumber(agency.avgWordsPerSection)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
