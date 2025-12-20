import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAgencies, Agency } from '../api';

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
}

export default function AgencyList() {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchAgencies().then(data => {
            setAgencies(data.agencies);
            setLoading(false);
        });
    }, []);

    const filtered = agencies.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.shortName?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="loading"><div className="spinner" /><p>Loading...</p></div>;

    return (
        <div>
            <div className="section-header">
                <h2>Federal Agencies</h2>
                <p>{agencies.length} agencies with word counts and checksums</p>
            </div>

            <input
                type="text"
                placeholder="Search agencies..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: 'var(--space-md)',
                    marginBottom: 'var(--space-xl)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)'
                }}
            />

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Agency</th>
                            <th>Word Count</th>
                            <th>Checksum</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(a => (
                            <tr key={a.slug}>
                                <td>
                                    <Link to={`/agencies/${a.slug}`}>{a.name}</Link>
                                    {a.shortName && <span style={{ color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '0.85rem' }}>({a.shortName})</span>}
                                </td>
                                <td>{formatNumber(a.wordCount)}</td>
                                <td><code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{a.checksum}</code></td>
                                <td><Link to={`/agencies/${a.slug}`} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>View</Link></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <p style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>No agencies found</p>}
            </div>
        </div>
    );
}
