import React from 'react';

export default function FooterBar({ lineCount, itemTotalCount }) {
  return (
    <footer className="bottom-bar">
      <div className="status-items">
        <div className="status-item">
          <span>Total Líneas:</span>
          <strong>{lineCount}</strong>
        </div>
        <div className="status-item">
          <span>Ítems Totales:</span>
          <strong>{itemTotalCount}</strong>
        </div>
        <div className="status-item">
          <span>Último Ticket:</span>
          <strong>#002488</strong>
        </div>
        <div className="status-item">
          <span>Caja:</span>
          <strong>#01 (Principal)</strong>
        </div>
      </div>

      <div className="status-item">
        <span className="online-indicator"></span>
        <span style={{ color: 'var(--google-green)', fontWeight: 700 }}>
          Servidor Google a2 Conectado
        </span>
      </div>
    </footer>
  );
}
