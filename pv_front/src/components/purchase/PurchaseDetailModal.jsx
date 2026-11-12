import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

export default function PurchaseDetailModal({ isOpen, onClose, purchaseId }) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && purchaseId) {
      const fetchDetail = async () => {
        setLoading(true);
        setError('');
        const res = await apiClient.get(`/api/purchases/${purchaseId}`);
        setLoading(false);
        if (res.ok && res.data) {
          setDetail(res.data.purchase);
          setItems(Array.isArray(res.data.items) ? res.data.items : []);
        } else {
          setError(res.message || 'No se pudo cargar el detalle de la compra');
        }
      };
      fetchDetail();
    }
  }, [isOpen, purchaseId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" style={{ zIndex: 1100 }}>
      <div 
        className="modal-box" 
        style={{ 
          width: '740px', 
          maxWidth: '96vw', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column',
          padding: '24px 28px',
          borderRadius: '24px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.18)'
        }}
      >
        {/* ENCABEZADO */}
        <div className="modal-header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--google-blue)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <span>📋</span> Detalle de Factura de Compra #{purchaseId}
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Desglose de productos recibidos y valuación de costo en almacén.
            </p>
          </div>
          <button 
            type="button" 
            className="modal-close" 
            onClick={onClose} 
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Cargando desglose de la factura...
          </div>
        )}

        {error && (
          <div style={{ padding: '16px', color: '#c5221f', background: '#fce8e6', borderRadius: '12px' }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && detail && (
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* DATOS GENERALES */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '12px',
              padding: '14px',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid var(--panel-border)',
              fontSize: '0.85rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>N° Factura:</span>
                <strong className="code-col" style={{ fontSize: '0.95rem' }}>{detail.invoiceNumber}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Proveedor:</span>
                <strong style={{ color: 'var(--text-main)' }}>{detail.supplierName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Estado:</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  background: detail.status === 'ANULADA' ? '#fce8e6' : '#e6f4ea',
                  color: detail.status === 'ANULADA' ? '#c5221f' : '#137333'
                }}>
                  {detail.status || 'COMPLETADA'}
                </span>
              </div>
            </div>

            {detail.notes && (
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', background: '#fffdf5', border: '1px solid #fef7e0', padding: '8px 12px', borderRadius: '8px' }}>
                📝 <strong>Observaciones:</strong> {detail.notes}
              </div>
            )}

            {/* TABLA DE ÍTEMS */}
            <div style={{ border: '1px solid var(--panel-border)', borderRadius: '12px', overflow: 'hidden' }}>
              <table className="pos-table" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto Recibido</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Unidad</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>Cantidad</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>Costo Unit.</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Total ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="code-col">{it.barcode || '—'}</td>
                      <td><strong>{it.productName}</strong></td>
                      <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>{it.unit}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{it.quantity}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'Orbitron, monospace' }}>${Number(it.unitPrice).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'Orbitron, monospace', color: 'var(--google-blue)' }}>
                        ${Number(it.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTAL */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid var(--panel-border)'
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Monto Total Facturado:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'Orbitron, monospace', color: 'var(--google-blue)' }}>
                ${Number(detail.total || 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '14px', borderTop: '1px solid var(--panel-border)', paddingTop: '12px' }}>
          <button type="button" className="btn-modal secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
