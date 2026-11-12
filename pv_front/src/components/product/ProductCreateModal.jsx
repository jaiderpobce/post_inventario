import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';

export default function ProductCreateModal({ isOpen, onClose, onProductCreated }) {
  const { showSuccess, showError } = useNotification();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [internalCode, setInternalCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState(11);
  const [categories, setCategories] = useState([]);
  const [unit, setUnit] = useState('UND');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [ivaType, setIvaType] = useState('EXENTO');
  const [weightBased, setWeightBased] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Cargar categorías disponibles
  useEffect(() => {
    if (isOpen) {
      const loadCategories = async () => {
        try {
          const res = await apiClient.get('/api/products/categories');
          if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
            setCategories(res.data);
          } else {
            // Fallback estándar
            setCategories([
              { id: 11, nombre: 'Alimentos' },
              { id: 12, nombre: 'Bebidas' },
              { id: 13, nombre: 'Carnicería y Pollería' },
              { id: 14, nombre: 'Charcutería y Quesos' },
              { id: 15, nombre: 'Cuidado Personal' },
              { id: 16, nombre: 'Frutas y Verduras' },
              { id: 17, nombre: 'Limpieza y Hogar' },
              { id: 18, nombre: 'Lácteos y Refrigerados' },
              { id: 19, nombre: 'Panadería y Repostería' },
              { id: 20, nombre: 'Snacks y Golosinas' }
            ]);
          }
        } catch {
          // ignore
        }
      };
      loadCategories();

      // Reset de campos
      setName('');
      setBrand('');
      setInternalCode('');
      setBarcode('');
      setCategoryId(11);
      setUnit('UND');
      setPrice('');
      setCostPrice('');
      setStock('0');
      setIvaType('EXENTO');
      setWeightBased(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre o descripción del producto es requerido');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Ingrese un precio de venta válido mayor o igual a 0');
      return;
    }

    const numCost = costPrice ? parseFloat(costPrice) : numPrice * 0.75;
    const numStock = stock ? parseFloat(stock) : 0;

    setSaving(true);
    setError('');

    // Envío al backend procesado mediante apiClient
    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      internalCode: internalCode.trim(),
      barcode: barcode.trim(),
      categoryId: Number(categoryId),
      unit,
      price: numPrice,
      costPrice: numCost,
      stock: numStock,
      ivaType,
      weightBased
    };

    const result = await apiClient.post('/api/products', payload);
    setSaving(false);

    if (result.ok) {
      const created = result.data?.product || {
        id: Date.now(),
        code: barcode.trim() || internalCode.trim() || 'PROD-NUEVO',
        internalCode: internalCode.trim(),
        barcode: barcode.trim(),
        name: name.trim(),
        price: numPrice,
        stock: numStock,
        unit,
        weightBased,
        ivaRate: ivaType === 'GRAVADO' ? 0.16 : 0.0,
        status: 'ACTIVO'
      };

      showSuccess(result.message || `Producto "${name.trim()}" registrado exitosamente`);
      onProductCreated(created);
      onClose();
    } else {
      showError(result.message, 'Error al crear producto');
      setError(result.message);
    }
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 1100 }}>
      <div className="modal-box" style={{ width: '640px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* ENCABEZADO */}
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: 'var(--google-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📦</span> Registrar Nuevo Producto
          </h3>
          <button className="modal-close" onClick={onClose} type="button">✕</button>
        </div>

        {error && (
          <div style={{ background: '#fce8e6', color: '#c5221f', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* NOMBRE / DESCRIPCIÓN */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Nombre Comercial / Descripción del Producto *
            </label>
            <input 
              type="text" 
              className="search-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Harina de Trigo Todo Uso Robin Hood 1 kg..."
              required
              autoFocus
            />
          </div>

          {/* MARCA Y CATEGORÍA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Marca / Fabricante
              </label>
              <input 
                type="text" 
                className="search-input" 
                value={brand} 
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ej: Polar, Mary, Kraft..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Categoría / Departamento
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--panel-border)',
                  background: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CÓDIGO INTERNO Y CÓDIGO DE BARRAS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Código Interno (SKU)
              </label>
              <input 
                type="text" 
                className="search-input" 
                value={internalCode} 
                onChange={(e) => setInternalCode(e.target.value)}
                placeholder="Automático (PROD-XXXX)"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Código de Barras (EAN-13)
              </label>
              <input 
                type="text" 
                className="search-input" 
                value={barcode} 
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Ej: 7591001000115..."
              />
            </div>
          </div>

          {/* PRECIO VENTA, COSTO Y EXISTENCIA INICIAL */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--google-blue)', marginBottom: '6px' }}>
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
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Precio Costo ($ USD)
              </label>
              <input 
                type="number" 
                step="0.01" 
                className="search-input" 
                value={costPrice} 
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="Opcional"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--google-green)', marginBottom: '6px' }}>
                Stock Inicial (Almacén)
              </label>
              <input 
                type="number" 
                step="0.001" 
                className="search-input" 
                value={stock} 
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* UNIDAD DE MEDIDA, IVA Y PESABLE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '18px', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Unidad de Medida
              </label>
              <select
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  if (e.target.value === 'kg') setWeightBased(true);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--panel-border)',
                  background: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              >
                <option value="UND">Unidad (UND)</option>
                <option value="kg">Kilogramo (kg)</option>
                <option value="L">Litro (L)</option>
                <option value="PAQ">Paquete (PAQ)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Tratamiento Fiscal (IVA)
              </label>
              <select
                value={ivaType}
                onChange={(e) => setIvaType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: '1px solid var(--panel-border)',
                  background: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              >
                <option value="EXENTO">Exento (0%)</option>
                <option value="GRAVADO">Gravado (16%)</option>
              </select>
            </div>

            <div style={{ paddingTop: '18px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600 }}>
                <input 
                  type="checkbox" 
                  checked={weightBased} 
                  onChange={(e) => setWeightBased(e.target.checked)} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>⚖️ Pesable en Balanza</span>
              </label>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', borderTop: '1px solid var(--panel-border)', paddingTop: '16px' }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ padding: '9px 20px', borderRadius: '12px', border: '1px solid var(--panel-border)', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={saving}
              style={{ 
                padding: '9px 24px', 
                borderRadius: '12px', 
                border: 'none', 
                background: 'var(--google-blue)', 
                color: '#fff', 
                cursor: saving ? 'wait' : 'pointer', 
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {saving ? 'Guardando en BD...' : '💾 Registrar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
