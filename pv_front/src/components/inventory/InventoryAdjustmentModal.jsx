import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';

export default function InventoryAdjustmentModal({ isOpen, onClose, selectedProduct, onAdjustmentSuccess }) {
  const { showSuccess, showError } = useNotification();

  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('INGRESO');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const loadProducts = async () => {
        try {
          const res = await apiClient.get('/api/products');
          if (res.ok && Array.isArray(res.data)) {
            setProducts(res.data);
            if (selectedProduct) {
              setProductId(selectedProduct.productId || selectedProduct.id);
            } else if (res.data.length > 0) {
              setProductId(res.data[0].id);
            }
          }
        } catch {
          // ignore
        }
      };
      loadProducts();
      setAdjustmentType('INGRESO');
      setQuantity('1');
      setReason('');
      setError('');
    }
  }, [isOpen, selectedProduct]);

  if (!isOpen) return null;

  const currentProd = products.find(p => p.id === Number(productId));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productId) {
      setError('Seleccione un producto para el ajuste');
      return;
    }

    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty < 0) {
      setError('Ingrese una cantidad válida mayor o igual a 0');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      productId: Number(productId),
      warehouseId: 3,
      adjustmentType,
      quantity: numQty,
      reason: reason.trim()
    };

    const result = await apiClient.post('/api/inventory/adjust', payload);
    setSaving(false);

    if (result.ok) {
      showSuccess(result.message || 'Ajuste de inventario aplicado exitosamente');
      if (onAdjustmentSuccess) {
        onAdjustmentSuccess({
          productId: Number(productId),
          newStock: result.data?.newStock
        });
      }
      onClose();
    } else {
      showError(result.message, 'Fallo al ajustar stock');
      setError(result.message);
    }
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 1100 }}>
      <div 
        className="modal-box" 
        style={{ 
          width: '560px', 
          maxWidth: '96vw', 
          padding: '24px 28px',
          borderRadius: '24px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.18)'
        }}
      >
        {/* ENCABEZADO */}
        <div className="modal-header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--google-blue)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <span>⚖️</span> Ajuste Manual de Existencias / Kardex
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Registra entradas, mermas o conteos físicos en el almacén principal.
            </p>
          </div>
          <button 
            type="button" 
            className="modal-close" 
            onClick={onClose} 
            disabled={saving}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            background: '#fce8e6',
            border: '1px solid #fad2cf',
            color: '#c5221f',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '0.86rem',
            marginBottom: '16px'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* SELECCIÓN DE PRODUCTO */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Producto a Ajustar <span style={{ color: '#ea4335' }}>*</span>
            </label>
            <select 
              className="search-input" 
              value={productId} 
              onChange={(e) => setProductId(e.target.value)}
              style={{ cursor: 'pointer' }}
              required
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.barcode ? `(${p.barcode})` : ''} — Stock Actual: {p.stock}
                </option>
              ))}
            </select>
          </div>

          {currentProd && (
            <div style={{
              background: '#e8f0fe',
              border: '1px solid #c2e7ff',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Existencia en Sistema:</span>
              <strong style={{ color: 'var(--google-blue)', fontSize: '0.95rem' }}>
                {currentProd.stock} {currentProd.unit || 'UND'}
              </strong>
            </div>
          )}

          {/* TIPO DE AJUSTE */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Tipo de Operación
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setAdjustmentType('INGRESO')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid ' + (adjustmentType === 'INGRESO' ? 'var(--google-green)' : 'var(--panel-border)'),
                  background: adjustmentType === 'INGRESO' ? '#e6f4ea' : '#ffffff',
                  color: adjustmentType === 'INGRESO' ? '#137333' : 'var(--text-main)'
                }}
              >
                ＋ Entrada / Ingreso
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('EGRESO')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid ' + (adjustmentType === 'EGRESO' ? '#ea4335' : 'var(--panel-border)'),
                  background: adjustmentType === 'EGRESO' ? '#fce8e6' : '#ffffff',
                  color: adjustmentType === 'EGRESO' ? '#c5221f' : 'var(--text-main)'
                }}
              >
                － Salida / Merma
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('AJUSTE')}
                style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid ' + (adjustmentType === 'AJUSTE' ? 'var(--google-blue)' : 'var(--panel-border)'),
                  background: adjustmentType === 'AJUSTE' ? '#e8f0fe' : '#ffffff',
                  color: adjustmentType === 'AJUSTE' ? 'var(--google-blue)' : 'var(--text-main)'
                }}
              >
                ＝ Conteo Directo
              </button>
            </div>
          </div>

          {/* CANTIDAD */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              {adjustmentType === 'AJUSTE' ? 'Nueva Existencia Total Real' : 'Cantidad a Ajustar'}
            </label>
            <input 
              type="number" 
              step="0.001" 
              min="0"
              className="search-input" 
              value={quantity} 
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.000"
              required
            />
          </div>

          {/* MOTIVO */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Motivo o Justificación del Movimiento
            </label>
            <input 
              type="text" 
              className="search-input" 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Conteo físico de fin de mes, merma por empaque roto"
            />
          </div>

          {/* ACCIONES */}
          <div className="modal-actions" style={{ marginTop: '12px', borderTop: '1px solid var(--panel-border)', paddingTop: '14px' }}>
            <button 
              type="button" 
              className="btn-modal secondary" 
              onClick={onClose} 
              disabled={saving}
            >
              Cancelar (Esc)
            </button>
            <button 
              type="submit" 
              className="btn-modal primary" 
              disabled={saving}
              style={{ minWidth: '150px' }}
            >
              {saving ? 'Aplicando...' : '✓ Aplicar Ajuste'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
