import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

export default function Header({ onTriggerFKey, onClearSale, onShowToast }) {
  const [timeStr, setTimeStr] = useState('--:--:--');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString());
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-logo">G</div>
        <div className="brand-text">
          <h1>a2 POS <span>Material 3 Light</span></h1>
        </div>
      </div>

      <nav className="top-menu">
        <NavLink 
          to="/" 
          className={({ isActive }) => `menu-btn ${isActive ? 'active' : ''}`}
        >
          Operaciones
        </NavLink>
        <NavLink 
          to="/reports" 
          className={({ isActive }) => `menu-btn ${isActive ? 'active' : ''}`}
        >
          Reportes
        </NavLink>
        <NavLink 
          to="/system" 
          className={({ isActive }) => `menu-btn ${isActive ? 'active' : ''}`}
        >
          Sistema
        </NavLink>
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

      <div className="user-info">
        <div className="user-avatar">LM</div>
        <div>
          <div style={{ fontWeight: 700, color: '#202124' }}>Laura Morales</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{timeStr}</div>
        </div>
      </div>
    </header>
  );
}
