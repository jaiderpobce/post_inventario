import React, { useState, useEffect } from 'react';
import { ProductModel } from '../models/ProductModel';

export default function ProductsView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError('No se pudo conectar con el catálogo de productos.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = ProductModel.filterProducts(products, searchTerm);

  return (
    <div style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto', flex: 1, width: '100%' }}>
      <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '20px', padding: '28px', boxShadow: 'var(--shadow-main)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0 }}>
              📦 Catálogo e Inventario de Productos
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
              Gestión de artículos, precios de venta, existencia en almacén y códigos de barra.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span style={{ background: '#e8f0fe', color: 'var(--google-blue)', padding: '8px 14px', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem' }}>
              Total: {products.length} productos
            </span>
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="search-bar-container" style={{ marginBottom: '20px' }}>
          <div className="search-input-wrapper">
            <span>🔍</span>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar por código de barra, código interno o descripción..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TABLA DE PRODUCTOS */}
        <div style={{ maxHeight: '550px', overflowY: 'auto', border: '1px solid var(--panel-border)', borderRadius: '14px' }}>
          <table className="pos-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Código</th>
                <th>Descripción del Producto</th>
                <th style={{ width: '110px' }}>Unidad</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Existencia</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Precio ($)</th>
                <th style={{ width: '90px', textAlign: 'center' }}>IVA</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>
                    Cargando productos de la base de datos...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#c5221f', padding: '24px' }}>
                    ⚠️ {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No se encontraron productos coincidentes.
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.map(p => (
                <tr key={p.id}>
                  <td className="code-col" style={{ fontWeight: 600 }}>{p.code}</td>
                  <td>
                    <strong>{p.name}</strong>
                    {p.weightBased && (
                      <span style={{ marginLeft: '8px', fontSize: '0.72rem', background: '#fef7e0', color: '#b06000', padding: '2px 6px', borderRadius: '6px' }}>
                        ⚖️ Pesable
                      </span>
                    )}
                  </td>
                  <td>{p.unit}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: p.stock > 10 ? 'var(--google-green)' : '#d93025' }}>
                    {p.stock}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'Orbitron, monospace', color: 'var(--google-blue)' }}>
                    ${Number(p.price).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {p.ivaRate > 0 ? `${(p.ivaRate * 100).toFixed(0)}%` : 'Exento'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
