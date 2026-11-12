import React from 'react';

const FKEYS = [
  { key: 'F1', label: 'Clientes', icon: '👤', accent: '' },
  { key: 'F2', label: 'Devolución', icon: '↩️', accent: 'accent-yellow' },
  { key: 'F3', label: 'Anular', icon: '🚫', accent: 'accent-red' },
  { key: 'F4', label: 'Eliminar', icon: '🗑️', accent: 'accent-red' },
  { key: 'F5', label: 'Cantidad', icon: '🔢', accent: '' },
  { key: 'F6', label: 'Cargar', icon: '📂', accent: '' },
  { key: 'F7', label: 'Guardar', icon: '💾', accent: '' },
  { key: 'F8', label: 'Preliminar', icon: '📋', accent: '' },
  { key: 'F9', label: 'Reimprimir', icon: '🖨️', accent: '' },
  { key: 'F10', label: 'Totalizar', icon: '💳', accent: 'accent-green' },
  { key: 'F11', label: 'Precios', icon: '🏷️', accent: '' },
  { key: 'F12', label: 'Detalle', icon: '🔍', accent: '' }
];

export default function SidebarFKeys({ onTriggerFKey }) {
  return (
    <aside className="sidebar-actions">
      <div className="sidebar-title">
        <span>Teclas de Función</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--google-blue)' }}>Google Light</span>
      </div>

      <div className="fkeys-grid">
        {FKEYS.map((item) => (
          <div
            key={item.key}
            className={`fkey-card ${item.accent}`}
            onClick={() => onTriggerFKey(item.key)}
          >
            <div className="fkey-header">
              <span className="fkey-badge">{item.key}</span>
              <span className="fkey-icon">{item.icon}</span>
            </div>
            <span className="fkey-label">{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
