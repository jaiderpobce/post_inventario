import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Componente para renderizar iconos SVG profesionales vectoriales según el campo 'icono' de la BD pos_rbac.modulo
function ModuleIcon({ name }) {
  const icon = String(name || '').toLowerCase();

  // 1. Punto de Venta (POS / Caja)
  if (icon.includes('pos') || icon.includes('point_of_sale') || icon.includes('caja')) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <line x1="6" y1="15" x2="10" y2="15" />
        <line x1="14" y1="15" x2="18" y2="15" />
        <path d="M7 21h10" />
      </svg>
    );
  }

  // 2. Administración / Dashboard
  if (icon.includes('admin') || icon.includes('panel') || icon.includes('administracion')) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    );
  }

  // 3. Reportes / Gráficos
  if (icon.includes('chart') || icon.includes('report') || icon.includes('bar_chart')) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    );
  }

  // 4. Sistema / Ajustes
  if (icon.includes('setting') || icon.includes('sistema') || icon.includes('gear')) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    );
  }

  // 5. Clientes / Personas
  if (icon.includes('people') || icon.includes('cliente') || icon.includes('user')) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  // 6. Inventario / Paquete
  if (icon.includes('inventory') || icon.includes('producto') || icon.includes('stock')) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    );
  }

  // Icono por defecto (Carpeta)
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function Header({ onTriggerFKey, onClearSale, onShowToast }) {
  const [timeStr, setTimeStr] = useState('--:--:--');
  const { user, modules, isAuthenticated, switchRole, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const initials = `${user?.nombre?.[0] || 'U'}${user?.apellido?.[0] || ''}`.toUpperCase();

  return (
    <header className="topbar">
      {/* MARCA / LOGO */}
      <div className="brand" onClick={() => navigate(isAuthenticated ? '/pos' : '/login')} style={{ cursor: 'pointer' }}>
        <div className="brand-logo">G</div>
        <div className="brand-text">
          <h1>a2 POS <span>Material 3 Light</span></h1>
        </div>
      </div>

      {/* SI EL USUARIO NO ESTÁ AUTENTICADO: MOSTRAR SOLO RELOJ */}
      {!isAuthenticated && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>{timeStr}</span>
        </div>
      )}

      {/* SI EL USUARIO ESTÁ AUTENTICADO: MENÚ PROFESIONAL CON ICONOS DINÁMICOS */}
      {isAuthenticated && (
        <>
          <nav className="top-menu">
            {modules.map((mod) => (
              <NavLink 
                key={mod.id || mod.ruta}
                to={mod.ruta} 
                className={({ isActive }) => `menu-btn ${isActive ? 'active' : ''}`}
                title={mod.descripcion || mod.nombre}
              >
                <ModuleIcon name={mod.icono || mod.ruta} />
                <span>{mod.nombre}</span>
              </NavLink>
            ))}
          </nav>

          {/* INFORMACIÓN DEL USUARIO LOGUEADO */}
          <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="user-avatar" title={`Rol: ${user?.rol}`}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#202124', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                {user?.nombre} {user?.apellido || ''}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                <span style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 800, 
                  padding: '1px 6px', 
                  borderRadius: '4px',
                  background: user?.rol === 'SUPERADMIN' ? '#e8f0fe' : '#e6f4ea',
                  color: user?.rol === 'SUPERADMIN' ? 'var(--google-blue)' : 'var(--google-green)'
                }}>
                  {user?.rol || 'USUARIO'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{timeStr}</span>
              </div>
            </div>

            {/* BOTÓN RÁPIDO PARA ALTERNAR ROL DE PRUEBA */}
            <button
              onClick={() => switchRole(user?.rol === 'SUPERADMIN' ? 'CAJERO' : 'SUPERADMIN')}
              style={{
                marginLeft: '6px',
                fontSize: '0.7rem',
                padding: '5px 9px',
                borderRadius: '8px',
                border: '1px solid var(--panel-border)',
                background: '#ffffff',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Alternar rol para verificar la barra de menú dinámica"
            >
              <span>🔁</span>
              <span>{user?.rol === 'SUPERADMIN' ? 'Probar Cajero' : 'Probar Superadmin'}</span>
            </button>

            {/* BOTÓN CERRAR SESIÓN */}
            <button
              onClick={handleLogoutClick}
              style={{
                marginLeft: '4px',
                fontSize: '0.72rem',
                padding: '5px 9px',
                borderRadius: '8px',
                border: '1px solid #fad2cf',
                background: '#fce8e6',
                color: '#c5221f',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Cerrar Sesión y salir"
            >
              <span>🚪</span>
              <span>Salir</span>
            </button>
          </div>
        </>
      )}
    </header>
  );
}
