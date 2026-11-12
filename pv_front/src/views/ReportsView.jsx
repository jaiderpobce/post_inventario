import React from 'react';

export default function ReportsView() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', flex: 1 }}>
      <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '20px', padding: '30px', boxShadow: 'var(--shadow-main)' }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', marginBottom: '10px' }}>
          📊 Módulo de Reportes y Auditoría POS
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Consulte las ventas del día, el cuadre de caja (Corte X / Z) y estadísticas de facturación.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ background: '#f8f9fa', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '20px' }}>
            <h4 style={{ color: '#202124', marginBottom: '8px' }}>💰 Ventas de hoy</h4>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--google-green)', fontFamily: 'Orbitron, monospace' }}>$1,248.50</span>
          </div>

          <div style={{ background: '#f8f9fa', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '20px' }}>
            <h4 style={{ color: '#202124', marginBottom: '8px' }}>🧾 Total Transacciones</h4>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--google-blue)', fontFamily: 'Orbitron, monospace' }}>42 Tickets</span>
          </div>

          <div style={{ background: '#f8f9fa', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '20px' }}>
            <h4 style={{ color: '#202124', marginBottom: '8px' }}>🔒 Corte X / Z</h4>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--google-yellow)', fontFamily: 'Orbitron, monospace' }}>Caja #01</span>
          </div>
        </div>
      </div>
    </div>
  );
}
