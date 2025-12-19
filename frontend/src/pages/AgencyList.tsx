import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAgencies, Agency } from '../api';

export default function AgencyList() {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function loadData() {
            try {
                const agencyData = await fetchAgencies();
                setAgencies(agencyData.agencies);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const filteredAgencies = agencies.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.shortName && a.shortName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner" />
                <p>Loading agencies...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state">
                <h2>Unable to Load Agencies</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div>
            <div className="section-header">
                <h2>Federal Agencies</h2>
                <p>Browse all {agencies.length} agencies with CFR regulations</p>
            </div>

            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <input
                    type="text"
                    placeholder="Search agencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        padding: 'var(--space-md)',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: '1rem'
                    }}
                />
            </div>

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Agency Name</th>
                            <th>Short Name</th>
                            <th>CFR Titles</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAgencies.map(agency => (
                            <tr key={agency.slug}>
                                <td>
                                    <Link to={`/agencies/${agency.slug}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                                        {agency.name}
                                    </Link>
                                </td>
                                <td style={{ color: 'var(--text-secondary)' }}>{agency.shortName || '-'}</td>
                                <td>{agency.titleCount}</td>
                                <td>
                                    <Link to={`/agencies/${agency.slug}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAgencies.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                        No agencies found matching "{searchTerm}"
                    </div>
                )}
            </div>
        </div>
    );
}
