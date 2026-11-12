import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';

export default function PurchaseCreateModal({ isOpen, onClose, onPurchaseCreated }) {
  const { showSuccess, showError } = useNotification();

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [warehouseId, setWarehouseId] = useState(3);
  const [items, setItems] = useState([
    { productId: '', quantity: '1', unitPrice: '' }
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const loadInitialData = async () => {
        try {
          const [supRes, prodRes] = await Promise.all([
            apiClient.get('/api/purchases/suppliers'),
            apiClient.get('/api/products')
          ]);

          if (supRes.ok && Array.isArray(supRes.data)) {
            setSuppliers(supRes.data);
            if (supRes.data.length > 0) setSupplierId(supRes.data[0].id);
          }
          if (prodRes.ok && Array.isArray(prodRes.data)) {
            setProducts(prodRes.data);
            if (prodRes.data.length > 0) {
              setItems([{ productId: prodRes.data[0].id, quantity: '1', unitPrice: prodRes.data[0].costPrice || '1.00' }]);
            }
          }
        } catch {
          // ignore
        }
      };
      loadInitialData();
      setInvoiceNumber('');
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const firstProd = products[0];
    setItems(prev => [
      ...prev,
      { productId: firstProd ? firstProd.id : '', quantity: '1', unitPrice: firstProd ? (firstProd.costPrice || '1.00') : '' }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };

      // Si cambia el producto, auto-llenar el costo unitario
      if (field === 'productId') {
        const prod = products.find(p => p.id === Number(value));
        if (prod && prod.costPrice) {
          copy[index].unitPrice = prod.costPrice;
        }
      }
      return copy;
    });
  };

  const calculateTotal = () => {
    return items.reduce((acc, it) => {
      const q = parseFloat(it.quantity) || 0;
      const p = parseFloat(it.unitPrice) || 0;
      return acc + (q * p);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!supplierId) {
      setError('Seleccione un proveedor válido');
      return;
    }
    if (items.length === 0) {
      setError('Debe incluir al menos un producto');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productId) {
        setError(`Fila #${i + 1}: Debe seleccionar un producto`);
        return;
      }
      const q = parseFloat(it.quantity);
      const p = parseFloat(it.unitPrice);
      if (isNaN(q) || q <= 0) {
        setError(`Fila #${i + 1}: La cantidad debe ser mayor a 0`);
        return;
      }
      if (isNaN(p) || p < 0) {
        setError(`Fila #${i + 1}: El costo unitario debe ser mayor o igual a 0`);
        return;
      }
    }

    setSaving(true);
    setError('');

    const payload = {
      supplierId: Number(supplierId),
      invoiceNumber: invoiceNumber.trim() || `FC-${Date.now().toString().slice(-6)}`,
      notes: notes.trim(),
      warehouseId: Number(warehouseId),
      items: items.map(it => ({
        productId: Number(it.productId),
        quantity: parseFloat(it.quantity),
        unitPrice: parseFloat(it.unitPrice)
      }))
    };

    const result = await apiClient.post('/api/purchases', payload);
    setSaving(false);

    if (result.ok) {
      showSuccess(result.message || 'Factura de compra registrada con éxito');
      if (onPurchaseCreated) {
        onPurchaseCreated(result.data?.purchase);
      }
      onClose();
    } else {
      showError(result.message, 'Fallo al registrar compra');
      setError(result.message);
    }
  };

  const grandTotal = calculateTotal();

  return (
    <div className="modal-overlay active" style={{ zIndex: 1100 }}>
      <div 
        className="modal-box" 
        style={{ 
          width: '780px', 
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
              <span>🛒</span> Registrar Factura de Compra / Entrada de Mercancía
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Ingresa los productos recibidos para alimentar automáticamente las existencias de almacén.
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

        {/* ALERTA DE ERROR */}
        {error && (
          <div style={{
            background: '#fce8e6',
            border: '1px solid #fad2cf',
            color: '#c5221f',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '0.86rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* CABECERA: PROVEEDOR, N FACTURA Y ALMACÉN */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Proveedor Distribuidor <span style={{ color: '#ea4335' }}>*</span>
              </label>
              <select 
                className="search-input" 
                value={supplierId} 
                onChange={(e) => setSupplierId(e.target.value)}
                style={{ cursor: 'pointer' }}
                required
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre} {s.doc ? `(${s.doc})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                N° Factura / Control Fiscal
              </label>
              <input 
                type="text" 
                className="search-input" 
                value={invoiceNumber} 
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Ej. FC-89421"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Almacén Destino
              </label>
              <select 
                className="search-input" 
                value={warehouseId} 
                onChange={(e) => setWarehouseId(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value={3}>Almacén Principal</option>
              </select>
            </div>
          </div>

          {/* OBSERVACIONES */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Notas / Observaciones de Recepción
            </label>
            <input 
              type="text" 
              className="search-input" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Despacho semanal, lote en buen estado, precintos verificados"
            />
          </div>

          {/* TABLA DE PRODUCTOS DE LA COMPRA */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--google-blue)' }}>
                📦 Productos Recibidos en Factura
              </span>
              <button 
                type="button" 
                onClick={handleAddItem}
                style={{
                  background: '#e8f0fe',
                  color: 'var(--google-blue)',
                  border: '1px solid #c2e7ff',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ＋ Agregar Fila
              </button>
            </div>

            <div style={{ border: '1px solid var(--panel-border)', borderRadius: '12px', overflow: 'hidden' }}>
              <table className="pos-table" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>Cantidad</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Costo Unit. ($)</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Subtotal ($)</th>
                    <th style={{ width: '45px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const lineSub = (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0);

                    return (
                      <tr key={idx}>
                        <td>
                          <select 
                            className="search-input"
                            value={it.productId}
                            onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                            style={{ padding: '6px', fontSize: '0.82rem', cursor: 'pointer' }}
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} {p.barcode ? `[${p.barcode}]` : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input 
                            type="number"
                            step="0.001"
                            min="0.001"
                            className="search-input"
                            value={it.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            style={{ textAlign: 'right', padding: '6px', fontSize: '0.84rem' }}
                            placeholder="1"
                          />
                        </td>
                        <td>
                          <input 
                            type="number"
                            step="0.01"
                            min="0"
                            className="search-input"
                            value={it.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            style={{ textAlign: 'right', padding: '6px', fontSize: '0.84rem' }}
                            placeholder="0.00"
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'Orbitron, monospace', color: 'var(--google-blue)' }}>
                          ${lineSub.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={items.length === 1}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: items.length === 1 ? '#dadce0' : '#ea4335',
                              cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: 700
                            }}
                            title="Eliminar fila"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOTAL CALCULADO */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '14px',
            padding: '12px 18px',
            background: '#f8f9fa',
            borderRadius: '12px',
            border: '1px solid var(--panel-border)',
            marginTop: '6px'
          }}>
            <span style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total de la Factura:</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'Orbitron, monospace', color: 'var(--google-blue)' }}>
              ${grandTotal.toFixed(2)}
            </span>
          </div>

          {/* BOTONERA ACCIONES */}
          <div className="modal-actions" style={{ marginTop: '10px', borderTop: '1px solid var(--panel-border)', paddingTop: '14px' }}>
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
              style={{ minWidth: '170px' }}
            >
              {saving ? 'Procesando...' : '✓ Registrar Factura'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
