import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';

export default function ProductEditModal({ isOpen, onClose, product, onSave }) {
  const { showSuccess, showError } = useNotification();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setPrice(product.price != null ? String(product.price) : '');
      setBarcode(product.barcode || product.code || '');
      setError('');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del producto no puede estar vacío');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Ingrese un precio de venta válido mayor o igual a 0');
      return;
    }

    setSaving(true);
    setError('');

    // Procesamiento centralizado mediante apiClient y el módulo de respuestas
    const result = await apiClient.put(`/api/products/${product.id}`, {
      name: name.trim(),
      price: numPrice,
      barcode: barcode.trim()
    });

    setSaving(false);

    if (result.ok) {
      showSuccess(result.message || 'Producto modificado exitosamente en la base de datos');
      onSave({
        ...product,
        name: name.trim(),
        price: numPrice,
        barcode: barcode.trim(),
        code: barcode.trim() || product.code
      });
      onClose();
    } else {
      showError(result.message, 'Error al modificar');
      setError(result.message);
    }
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 1100 }}>
      <div className="modal-box" style={{ width: '520px', padding: '26px' }}>
        <div className="modal-header" style={{ marginBottom: '18px' }}>
          <h3 style={{ margin: 0, color: 'var(--google-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✏️</span> Modificar Producto #{product.id}
          </h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#fce8e6', color: '#c5221f', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Código Interno
            </label>
            <input 
              type="text" 
              className="search-input" 
              value={product.internalCode || product.code || ''} 
              disabled 
              style={{ background: '#f1f3f4', cursor: 'not-allowed', color: 'var(--text-muted)' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Descripción / Nombre Comercial *
            </label>
            <input 
              type="text" 
              className="search-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del producto..."
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Precio Venta ($ USD) *
              </label>
              <input 
                type="number" 
                step="0.01" 
                className="search-input" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Código de Barras
              </label>
              <input 
                type="text" 
                className="search-input" 
                value={barcode} 
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="759..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ padding: '9px 18px', borderRadius: '12px', border: '1px solid var(--panel-border)', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={saving}
              style={{ 
                padding: '9px 20px', 
                borderRadius: '12px', 
                border: 'none', 
                background: 'var(--google-blue)', 
                color: '#fff', 
                cursor: saving ? 'wait' : 'pointer', 
                fontWeight: 700 
              }}
            >
              {saving ? 'Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
