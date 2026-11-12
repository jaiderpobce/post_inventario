import React, { useState, useEffect } from 'react';
import { ProductModel } from '../models/ProductModel';
import { useNotification } from '../context/NotificationContext';
import ProductEditModal from '../components/product/ProductEditModal';
import apiClient from '../services/apiClient';

export default function ProductsView() {
  const { showSuccess, showError } = useNotification();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const result = await apiClient.get('/api/products');
    setLoading(false);
    if (result.ok) {
      setProducts(Array.isArray(result.data) ? result.data : []);
      setError('');
    } else {
      setError(result.message);
      showError(result.message, 'Catálogo de Productos');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedProduct(null);
  }, [searchTerm]);

  const filtered = ProductModel.filterProducts(products, searchTerm);
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleToggleSuspend = async () => {
    if (!selectedProduct) return;
    const isSuspended = selectedProduct.status === 'SUSPENDIDO';
    const newStatus = isSuspended ? 'ACTIVO' : 'SUSPENDIDO';

    const result = await apiClient.patch(`/api/products/${selectedProduct.id}/status`, { status: newStatus });
    if (result.ok) {
      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, status: newStatus } : p));
      setSelectedProduct(prev => prev ? { ...prev, status: newStatus } : null);
      showSuccess(result.message || `Producto "${selectedProduct.name}" ${isSuspended ? 'reactivado' : 'suspendido'} exitosamente`);
    } else {
      showError(result.message, 'Fallo al cambiar estado');
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    const confirmed = window.confirm(`¿Seguro que desea eliminar el producto "${selectedProduct.name}"?`);
    if (!confirmed) return;

    const result = await apiClient.delete(`/api/products/${selectedProduct.id}`);
    if (result.ok) {
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      setSelectedProduct(null);
      showSuccess(result.message || `Producto "${selectedProduct.name}" eliminado del catálogo`);
    } else {
      showError(result.message, 'Fallo al eliminar');
    }
  };

  const handleSaveEditedProduct = (updated) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedProduct(updated);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', flex: 1, width: '100%' }}>
      <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '20px', padding: '28px', boxShadow: 'var(--shadow-main)' }}>
        
        {/* ENCABEZADO Y BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.4rem' }}>
              📦 Catálogo e Inventario de Productos
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.88rem' }}>
              Gestión integral de precios, códigos de barra, estados y existencia en almacén.
            </p>
          </div>

          {/* BOTONERA DE ACCIONES AL SELECCIONAR */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn-quick-add" 
              onClick={() => alert('Modal para registrar nuevo producto')}
            >
              ＋ Nuevo Producto
            </button>

            {/* BOTÓN MODIFICAR */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              disabled={!selectedProduct}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid ' + (selectedProduct ? 'var(--google-blue)' : 'var(--panel-border)'),
                background: selectedProduct ? '#e8f0fe' : '#f1f3f4',
                color: selectedProduct ? 'var(--google-blue)' : '#9aa0a6',
                cursor: selectedProduct ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)'
              }}
              title={selectedProduct ? `Modificar ${selectedProduct.name}` : 'Seleccione un producto para modificar'}
            >
              <span>✏️</span> Modificar
            </button>

            {/* BOTÓN SUSPENDER / REACTIVAR */}
            <button
              onClick={handleToggleSuspend}
              disabled={!selectedProduct}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid ' + (selectedProduct ? '#f9ab00' : 'var(--panel-border)'),
                background: selectedProduct ? '#fef7e0' : '#f1f3f4',
                color: selectedProduct ? '#b06000' : '#9aa0a6',
                cursor: selectedProduct ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)'
              }}
              title={selectedProduct ? (selectedProduct.status === 'SUSPENDIDO' ? 'Reactivar producto' : 'Suspender producto') : 'Seleccione un producto para suspender o reactivar'}
            >
              <span>{selectedProduct?.status === 'SUSPENDIDO' ? '▶️' : '⏸️'}</span> 
              {selectedProduct?.status === 'SUSPENDIDO' ? 'Reactivar' : 'Suspender'}
            </button>

            {/* BOTÓN ELIMINAR */}
            <button
              onClick={handleDeleteProduct}
              disabled={!selectedProduct}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid ' + (selectedProduct ? '#ea4335' : 'var(--panel-border)'),
                background: selectedProduct ? '#fce8e6' : '#f1f3f4',
                color: selectedProduct ? '#c5221f' : '#9aa0a6',
                cursor: selectedProduct ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)'
              }}
              title={selectedProduct ? `Eliminar ${selectedProduct.name}` : 'Seleccione un producto para eliminar'}
            >
              <span>🗑️</span> Eliminar
            </button>
          </div>
        </div>

        {/* FEEDBACK TOAST LOCAL */}
        {toastMessage && (
          <div style={{
            background: '#e6f4ea',
            border: '1px solid #ceead6',
            color: '#137333',
            padding: '10px 16px',
            borderRadius: '12px',
            fontSize: '0.86rem',
            fontWeight: 600,
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✅</span> {toastMessage}
          </div>
        )}

        {/* BARRA INFORMATIVA DE SELECCIÓN */}
        {selectedProduct && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#e8f0fe',
            border: '1px solid #c2e7ff',
            padding: '8px 16px',
            borderRadius: '12px',
            marginBottom: '14px',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: 'var(--google-blue)' }}>Seleccionado:</span>
              <span className="code-col" style={{ fontWeight: 700 }}>{selectedProduct.code}</span>
              <strong style={{ color: 'var(--text-main)' }}>{selectedProduct.name}</strong>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>Precio: <strong style={{ color: 'var(--google-blue)' }}>${Number(selectedProduct.price).toFixed(2)}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>Stock: <strong>{selectedProduct.stock} {selectedProduct.unit}</strong></span>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '6px', 
                fontSize: '0.72rem', 
                fontWeight: 800,
                background: selectedProduct.status === 'SUSPENDIDO' ? '#fef7e0' : '#e6f4ea',
                color: selectedProduct.status === 'SUSPENDIDO' ? '#b06000' : '#137333'
              }}>
                {selectedProduct.status || 'ACTIVO'}
              </span>
            </div>
            <button 
              onClick={() => setSelectedProduct(null)} 
              style={{ background: 'none', border: 'none', color: 'var(--google-blue)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
            >
              ✕ Deseleccionar
            </button>
          </div>
        )}

        {/* BUSCADOR */}
        <div className="search-bar-container" style={{ marginBottom: '16px' }}>
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

        {/* TABLA GRID DE PRODUCTOS */}
        <div style={{ maxHeight: '480px', overflowY: 'auto', border: '1px solid var(--panel-border)', borderRadius: '14px' }}>
          <table className="pos-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>Sel</th>
                <th style={{ width: '130px' }}>Código</th>
                <th>Descripción del Producto</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Estado</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Unidad</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Stock</th>
                <th style={{ width: '110px', textAlign: 'right' }}>Precio ($)</th>
                <th style={{ width: '80px', textAlign: 'center' }}>IVA</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '28px' }}>
                    Cargando productos de la base de datos...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#c5221f', padding: '28px' }}>
                    ⚠️ {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                    No se encontraron productos coincidentes.
                  </td>
                </tr>
              )}
              {!loading && !error && paginated.map(p => {
                const isSelected = selectedProduct?.id === p.id;
                const isSuspended = p.status === 'SUSPENDIDO';

                return (
                  <tr 
                    key={p.id}
                    onClick={() => setSelectedProduct(isSelected ? null : p)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#e8f0fe' : (isSuspended ? '#fffdf5' : '#ffffff'),
                      boxShadow: isSelected ? 'inset 3px 0 0 var(--google-blue)' : undefined,
                      transition: 'background-color 0.15s ease'
                    }}
                    title="Haz clic para seleccionar este producto"
                  >
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="radio" 
                        name="productsViewRadio"
                        checked={isSelected}
                        onChange={() => setSelectedProduct(isSelected ? null : p)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td className="code-col" style={{ fontWeight: 600 }}>{p.code}</td>
                    <td>
                      <span style={{ fontWeight: isSelected ? 700 : 500, color: isSuspended ? 'var(--text-muted)' : 'var(--text-main)' }}>
                        {p.name}
                      </span>
                      {p.weightBased && (
                        <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: '#fef7e0', color: '#b06000', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          ⚖️ Pesable
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: isSuspended ? '#fef7e0' : (p.status === 'INACTIVO' ? '#fce8e6' : '#e6f4ea'),
                        color: isSuspended ? '#b06000' : (p.status === 'INACTIVO' ? '#c5221f' : '#137333')
                      }}>
                        {p.status || 'ACTIVO'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '0.82rem' }}>{p.unit}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: p.stock > 10 ? 'var(--google-green)' : '#d93025' }}>
                      {p.stock}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'Orbitron, monospace', color: 'var(--google-blue)' }}>
                      ${Number(p.price).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                      {p.ivaRate > 0 ? `${(p.ivaRate * 100).toFixed(0)}%` : 'Exento'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BARRA DE PAGINACIÓN */}
        {!loading && totalItems > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 4px 4px 4px',
            marginTop: '10px',
            flexWrap: 'wrap',
            gap: '12px',
            borderTop: '1px solid var(--panel-border)'
          }}>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Mostrando <strong style={{ color: 'var(--text-main)' }}>{totalItems > 0 ? startIndex + 1 : 0}</strong> a{' '}
              <strong style={{ color: 'var(--text-main)' }}>{Math.min(startIndex + itemsPerPage, totalItems)}</strong> de{' '}
              <strong style={{ color: 'var(--google-blue)' }}>{totalItems}</strong> productos
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>Filas por página:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)',
                    background: '#ffffff',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '5px 9px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)',
                    background: '#ffffff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.4 : 1,
                    fontSize: '0.8rem'
                  }}
                  title="Primera página"
                >
                  «
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)',
                    background: '#ffffff',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.4 : 1,
                    fontSize: '0.8rem'
                  }}
                  title="Página anterior"
                >
                  ‹ Anterior
                </button>

                <span style={{ fontSize: '0.84rem', fontWeight: 700, padding: '0 8px', color: 'var(--google-blue)' }}>
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)',
                    background: '#ffffff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    fontSize: '0.8rem'
                  }}
                  title="Página siguiente"
                >
                  Siguiente ›
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '5px 9px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)',
                    background: '#ffffff',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    fontSize: '0.8rem'
                  }}
                  title="Última página"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <ProductEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        product={selectedProduct} 
        onSave={handleSaveEditedProduct} 
      />
    </div>
  );
}
