import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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

      {/* SI EL USUARIO NO ESTÁ AUTENTICADO, SOLO MOSTRAR RELOJ */}
      {!isAuthenticated && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>{timeStr}</span>
        </div>
      )}

      {/* SI EL USUARIO ESTÁ AUTENTICADO: MOSTRAR MENÚ DINÁMICO SEGÚN SU ROL EN RBAC */}
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
                {mod.nombre}
              </NavLink>
            ))}
          </nav>

          <div className="top-shortcuts">
            <div className="shortcut-pill" onClick={() => onTriggerFKey && onTriggerFKey('F11')}>
              <kbd>Alt+F2</kbd> Consulta
            </div>
            <div className="shortcut-pill" onClick={() => onShowToast && onShowToast('Sistema Bloqueado. Presione clave para desbloquear.')}>
              <kbd>Alt+F3</kbd> Bloqueo
            </div>
            <div className="shortcut-pill" onClick={() => onTriggerFKey && onTriggerFKey('F6')}>
              <kbd>Alt+F4</kbd> Manejo
            </div>
            <div className="shortcut-pill" onClick={() => onTriggerFKey && onTriggerFKey('F10')}>
              <kbd>Alt+F10</kbd> Corte X
            </div>
            <div className="shortcut-pill" onClick={onClearSale}>
              <kbd>Esc</kbd> Limpiar
            </div>
          </div>

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
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid var(--panel-border)',
                background: '#ffffff',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontWeight: 600
              }}
              title="Alternar rol para verificar la barra de menú dinámica"
            >
              {user?.rol === 'SUPERADMIN' ? '🔁 Probar Cajero' : '🔁 Probar Superadmin'}
            </button>

            {/* BOTÓN CERRAR SESIÓN */}
            <button
              onClick={handleLogoutClick}
              style={{
                marginLeft: '4px',
                fontSize: '0.72rem',
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid #fad2cf',
                background: '#fce8e6',
                color: '#c5221f',
                cursor: 'pointer',
                fontWeight: 700
              }}
              title="Cerrar Sesión y salir"
            >
              🚪 Salir
            </button>
          </div>
        </>
      )}
    </header>
  );
}
