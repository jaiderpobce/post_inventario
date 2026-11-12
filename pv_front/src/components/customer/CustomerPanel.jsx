import React from 'react';

export default function CustomerPanel({ activeCustomer, onOpenCustomerModal }) {
  return (
    <div className="top-customer-col">
      <div className="top-customer-header">
        <span className="top-customer-tag">👤 Cliente de Facturación</span>
        <button 
          className="shortcut-pill" 
          onClick={onOpenCustomerModal} 
          style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#ffffff', border: '1.5px solid #b0b5bc', color: '#000000', fontWeight: 800, cursor: 'pointer' }}
        >
          <kbd style={{ background: 'rgba(26,115,232,0.15)', color: '#1557b0', fontWeight: 900 }}>F1</kbd> Cambiar Cliente
        </button>
      </div>

      <h3 className="top-customer-name">
        {activeCustomer?.name || 'Cliente Genérico'}
      </h3>

      <div className="top-customer-meta">
        <span>RIF/CI: <strong>{activeCustomer?.doc || 'Sin Documento'}</strong></span>
        <span>Tel: <strong>{activeCustomer?.phone || 'Sin Teléfono'}</strong></span>
        <span className="cust-badge">{activeCustomer?.type || 'Consumidor Final'}</span>
      </div>
    </div>
  );
}
