import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AgencyList from './pages/AgencyList';
import AgencyDetail from './pages/AgencyDetail';

function Header() {
    const location = useLocation();

    return (
        <header className="header">
            <div className="header-content">
                <Link to="/" className="logo">
                    <div className="logo-icon">eC</div>
                    <div className="logo-text">
                        <h1>eCFR Analyzer</h1>
                        <span>Federal Regulations Analysis</span>
                    </div>
                </Link>
                <nav className="nav-links">
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                        Dashboard
                    </Link>
                    <Link to="/agencies" className={location.pathname.startsWith('/agencies') ? 'active' : ''}>
                        Agencies
                    </Link>
                </nav>
            </div>
        </header>
    );
}

function App() {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <div className="app">
                <Header />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/agencies" element={<AgencyList />} />
                        <Route path="/agencies/:slug" element={<AgencyDetail />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
