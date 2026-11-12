import React, { useState } from 'react';
import { ProductModel } from '../../models/ProductModel';

export default function CatalogModal({ isOpen, onClose, products, isLoading, error, onAddToCart }) {
  const [filter, setFilter] = useState('');

  if (!isOpen) return null;

  const filteredProducts = ProductModel.filterProducts(products, filter);

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}>
      <div className="modal-box" style={{ width: '680px' }}>
        <div className="modal-header">
          <h3>🏷️ Catálogo y Precios de Productos (F11)</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="search-input-wrapper" style={{ marginBottom: '16px' }}>
          <span>🔍</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Filtrar catálogo..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--panel-border)', borderRadius: '10px' }}>
          <table className="pos-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Stock</th>
                <th style={{ textAlign: 'right' }}>Precio / unidad</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="5">Cargando productos de la base de datos...</td>
                </tr>
              )}
              {!isLoading && error && (
                <tr>
                  <td colSpan="5" role="alert">{error}</td>
                </tr>
              )}
              {!isLoading && !error && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="5">No hay productos activos registrados.</td>
                </tr>
              )}
              {filteredProducts.map(p => (
                <tr key={p.id}>
                  <td className="code-col">{p.code}</td>
                  <td>{p.name}</td>
                  <td>
                    <span style={{ color: 'var(--google-green)', fontWeight: 700 }}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="price-col" style={{ textAlign: 'right' }}>
                    ${p.price.toFixed(2)} / {p.unit || 'UND'}
                  </td>
                  <td>
                    <button 
                      className="btn-quick-add" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }} 
                      onClick={() => onAddToCart(p)}
                    >
                      ＋ Añadir
                    </button>
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
