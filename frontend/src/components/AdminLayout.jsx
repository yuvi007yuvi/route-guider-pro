import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdDashboard, MdPeople, MdMap, MdAssignment, MdLogout } from 'react-icons/md';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const logoutHandler = () => {
        localStorage.removeItem('userInfo');
        navigate('/');
    };

    const navLinks = [
        { name: 'Dashboard', path: '/admin', icon: <MdDashboard size={20} className="me-3" /> },
        { name: 'Manage Users', path: '/admin/drivers', icon: <MdPeople size={20} className="me-3" /> },
        { name: 'Manage Routes', path: '/admin/routes', icon: <MdMap size={20} className="me-3" /> },
        { name: 'Assignments', path: '/admin/assignments', icon: <MdAssignment size={20} className="me-3" /> },
    ];

    return (
        <div className="admin-layout">
            <aside className={`admin-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                <div className="sidebar-brand cursor-pointer d-flex flex-column" style={{ cursor: 'pointer' }}>
                    {/* Mobile Close Button */}
                    <div className="d-flex justify-content-end w-100 d-md-none mb-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(false); }}
                            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '2rem', lineHeight: '1', padding: '0' }}
                        >
                            &times;
                        </button>
                    </div>
                    <div className="d-flex flex-column align-items-center w-100" onClick={() => navigate('/admin')}>
                        <div className="d-flex justify-content-center mb-2 bg-white rounded p-1 w-100">
                            <img src="/nagar-nigam (1).png" alt="Nagar Nigam" height="40" className="me-2" style={{ objectFit: 'contain' }} />
                            <img src="/NatureGreen_Logo.png" alt="Nature Green" height="40" style={{ objectFit: 'contain' }} />
                        </div>
                        <span style={{ fontSize: '1.1rem' }}>Route Guider Pro</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {navLinks.map((link) => (
                        <div 
                            key={link.name}
                            className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
                            onClick={() => navigate(link.path)}
                            style={{ cursor: 'pointer' }}
                        >
                            {link.icon}
                            {link.name}
                        </div>
                    ))}
                </nav>
                <div style={{ padding: '15px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div 
                        className="sidebar-link mb-3" 
                        onClick={logoutHandler}
                        style={{ cursor: 'pointer', padding: '10px' }}
                    >
                        <MdLogout size={20} className="me-3" />
                        <span className="fw-bold">Logout</span>
                    </div>
                    <div 
                        className="rounded p-2 text-center" 
                        style={{ 
                            background: 'rgba(255,255,255,0.1)', 
                            border: '1px solid rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(4px)'
                        }}
                    >
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Crafted with <span style={{ color: '#ef4444' }}>♥</span> by
                        </div>
                        <div className="fw-bold" style={{ fontSize: '0.85rem', color: '#fff', letterSpacing: '0.5px', marginTop: '2px' }}>
                            Yuvraj Singh Tomar
                        </div>
                    </div>
                </div>
            </aside>
            <main className={`admin-main ${!isSidebarOpen ? 'expanded' : ''}`}>
                <header className="admin-header">
                    <div className="d-flex align-items-center">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                fontSize: '1.5rem', 
                                cursor: 'pointer',
                                marginRight: '15px',
                                color: 'var(--text-main)'
                            }}
                        >
                            ☰
                        </button>
                        <h4 className="m-0 text-muted d-none d-sm-block">Admin Portal</h4>
                    </div>
                    <div className="d-flex align-items-center">
                        <div className="bg-light rounded-circle d-flex justify-content-center align-items-center me-2" style={{ width: '40px', height: '40px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            A
                        </div>
                        <span className="fw-bold">Administrator</span>
                    </div>
                </header>
                <div className="admin-content">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
