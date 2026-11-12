import React from 'react';

export default function SystemView() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', flex: 1 }}>
      <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '20px', padding: '30px', boxShadow: 'var(--shadow-main)' }}>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', marginBottom: '10px' }}>
          ⚙️ Configuración del Sistema POS a2
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Ajustes de terminal, impresoras fiscales, tasas de IVA e integración de red.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div style={{ background: '#f8f9fa', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '20px' }}>
            <h4 style={{ color: '#202124', marginBottom: '8px' }}>🖨️ Impresora Fiscal / Ticketera</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Modelo: Epson TM-T20III (Puerto COM1 - 9600 baud)</p>
          </div>

          <div style={{ background: '#f8f9fa', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '20px' }}>
            <h4 style={{ color: '#202124', marginBottom: '8px' }}>🌐 Servidor de Base de Datos</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Conexión: Localhost (a2 POS DB Engine v3.4)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
