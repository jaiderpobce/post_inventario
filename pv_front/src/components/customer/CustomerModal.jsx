import React, { useState } from 'react';
import { CustomerModel } from '../../models/CustomerModel';

export default function CustomerModal({ isOpen, onClose, customers, onSelectCustomer, onRegisterNewCustomer }) {
  const [filter, setFilter] = useState('');

  if (!isOpen) return null;

  const filteredCustomers = CustomerModel.filterCustomers(customers, filter);

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}>
      <div className="modal-box" style={{ width: '680px' }}>
        <div className="modal-header">
          <h3>👤 Buscar y Seleccionar Cliente (F1)</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="search-input-wrapper" style={{ marginBottom: '16px' }}>
          <span>🔍</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar por RIF, cédula, nombre o correo..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--panel-border)', borderRadius: '10px', marginBottom: '16px' }}>
          <table className="pos-table">
            <thead>
              <tr>
                <th>RIF / CI</th>
                <th>Nombre / Razón Social</th>
                <th>Teléfono</th>
                <th>Tipo</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => (
                <tr key={c.id}>
                  <td className="code-col">{c.doc}</td>
                  <td><strong>{c.name}</strong></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.phone}</td>
                  <td>
                    <span style={{ fontSize: '0.72rem', color: 'var(--google-blue)', fontWeight: 700 }}>
                      {c.type}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-quick-add" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }} 
                      onClick={() => {
                        onSelectCustomer(c);
                        onClose();
                      }}
                    >
                      ✓ Seleccionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-actions">
          <button className="btn-modal secondary" onClick={onClose}>Cerrar (Esc)</button>
          <button 
            className="btn-modal primary" 
            onClick={() => {
              onRegisterNewCustomer();
              onClose();
            }}
          >
            ＋ Registrar Nuevo Cliente
          </button>
        </div>
      </div>
    </div>
  );
}
