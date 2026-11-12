import React, { useState, useEffect } from 'react';
import { ProductModel } from '../models/ProductModel';
import { INITIAL_CUSTOMERS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import SubmoduleIcon from '../components/common/SubmoduleIcon';
import ProductEditModal from '../components/product/ProductEditModal';

export default function AdministrationView() {
  const { getSubmodules } = useAuth();
  const dbSubmodules = getSubmodules('/administracion');

  // Submódulos dinámicos leídos de pos_rbac.vistas (con fallback)
  const adminSubmodules = dbSubmodules.length > 0
    ? dbSubmodules.map(s => ({
        id: s.ruta.split('/').pop(),
        label: s.nombre,
        icono: s.icono,
        desc: s.descripcion
      }))
    : [
        { id: 'productos', label: 'Productos y Catálogo', icono: 'inventory_2', desc: 'Precios, códigos de barra y fichas' },
        { id: 'clientes', label: 'Clientes y Cuentas', icono: 'people', desc: 'Directorio fiscal y límites de crédito' },
        { id: 'compras', label: 'Compras y Proveedores', icono: 'shopping_cart', desc: 'Recepción de mercancía y facturas' },
        { id: 'inventario', label: 'Inventario y Almacén', icono: 'warehouse', desc: 'Existencias por almacén y kardex' },
        { id: 'categorias', label: 'Categorías y Medidas', icono: 'category', desc: 'Departamentos y unidades de medida' }
      ];

  // Estado para Productos
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Estado para Clientes
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [customerSearch, setCustomerSearch] = useState('');

  const [activeTab, setActiveTab] = useState('productos');

  // Reset de página al buscar productos
  useEffect(() => {
    setCurrentPage(1);
    setSelectedProduct(null);
  }, [productSearch]);

  // Auto-cierre de notificaciones toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3200);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Carga inicial de productos desde la base de datos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn('Error cargando productos:', err);
      } finally {
        setProductsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const filteredProducts = ProductModel.filterProducts(products, productSearch);
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleToggleSuspend = async () => {
    if (!selectedProduct) return;
    const isSuspended = selectedProduct.status === 'SUSPENDIDO';
    const newStatus = isSuspended ? 'ACTIVO' : 'SUSPENDIDO';
    try {
      await fetch(`/api/products/${selectedProduct.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.warn('Fallback en suspensión de producto:', e);
    }
    setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, status: newStatus } : p));
    setSelectedProduct(prev => prev ? { ...prev, status: newStatus } : null);
    setToastMessage(`Producto "${selectedProduct.name}" ${isSuspended ? 'reactivado' : 'suspendido'} exitosamente`);
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    const confirmed = window.confirm(`¿Seguro que desea eliminar o inactivar el producto "${selectedProduct.name}"?`);
    if (!confirmed) return;

    try {
      await fetch(`/api/products/${selectedProduct.id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Fallback al eliminar producto:', e);
    }
    setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
    setToastMessage(`Producto "${selectedProduct.name}" eliminado del catálogo`);
    setSelectedProduct(null);
  };

  const handleSaveEditedProduct = (updated) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedProduct(updated);
    setToastMessage(`Producto "${updated.name}" actualizado con éxito`);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.doc.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      minHeight: 'calc(100vh - 65px)',
      background: 'var(--bg-dark)',
      padding: '20px 24px',
      gap: '24px',
      maxWidth: '1500px',
      margin: '0 auto',
      width: '100%'
    }}>
      
      {/* ========================================================
          SIDEBAR LATERAL TIPO DASHBOARD (SUBMÓDULOS DE ADMINISTRACIÓN)
         ======================================================== */}
      <aside style={{
        width: '310px',
        background: '#ffffff',
        border: '1px solid var(--panel-border)',
        borderRadius: '20px',
        padding: '24px 16px',
        boxShadow: 'var(--shadow-main)',
        display: 'flex',
        flexDirection: 'column',
        height: 'fit-content'
      }}>
        {/* ENCABEZADO DEL SIDEBAR */}
        <div style={{ padding: '0 10px 18px 10px', borderBottom: '1px solid var(--panel-border)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.4rem' }}>📊</span>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.2rem' }}>
              Administración
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Gestión comercial, compras y almacenes
          </p>
        </div>

        {/* LISTA DE SUBMÓDULOS */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {adminSubmodules.map((sub) => {
            const isActive = activeTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveTab(sub.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: isActive ? '1px solid #c2e7ff' : '1px solid transparent',
                  background: isActive ? '#e8f0fe' : 'transparent',
                  color: isActive ? 'var(--google-blue)' : 'var(--text-main)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>
                  <SubmoduleIcon name={sub.icono} size={19} />
                </span>
                <div style={{ flex: 1 }}>
                  <div>{sub.label}</div>
                  <div style={{ fontSize: '0.7rem', color: isActive ? 'var(--google-blue-dark)' : 'var(--text-dim)', fontWeight: 400 }}>
                    {sub.desc}
                  </div>
                </div>
                {isActive && (
                  <span style={{ color: 'var(--google-blue)', fontSize: '0.9rem', fontWeight: 900 }}>›</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* PIE DEL SIDEBAR (RESUMEN OPERATIVO) */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--panel-border)', paddingLeft: '8px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Base de Datos Conectada:</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#137333', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#137333', display: 'inline-block' }}></span>
            inventario (MariaDB 10.11)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            Catálogo Activo: <strong>{products.length} productos</strong>
          </div>
        </div>
      </aside>

      {/* ========================================================
          PANEL PRINCIPAL CONTENEDOR SEGÚN EL SUBMÓDULO ACTIVO
         ======================================================== */}
      <main style={{
        flex: 1,
        background: '#ffffff',
        border: '1px solid var(--panel-border)',
        borderRadius: '20px',
        padding: '28px 32px',
        boxShadow: 'var(--shadow-main)',
        minHeight: '600px'
      }}>

        {/* 1. SUBMÓDULO: PRODUCTOS */}
        {activeTab === 'productos' && (
          <div>
            {/* ENCABEZADO Y BARRA DE ACCIONES PRINCIPALES */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: 0, fontSize: '1.4rem' }}>
                  📦 Catálogo Maestro de Productos
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Gestión integral de precios, códigos de barra, presentación y existencia.
                </p>
              </div>

              {/* BOTONERA DE ACCIONES (SE HABILITAN AL SELECCIONAR UN PRODUCTO) */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn-quick-add" 
                  onClick={() => alert('Modal para registrar nuevo producto')}
                  title="Registrar un nuevo producto en el catálogo"
                >
                  ＋ Nuevo
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
                  title={selectedProduct ? `Modificar ${selectedProduct.name}` : 'Seleccione un producto en la tabla para modificar'}
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
                  title={selectedProduct ? (selectedProduct.status === 'SUSPENDIDO' ? 'Reactivar producto para la venta' : 'Suspender producto temporalmente') : 'Seleccione un producto para suspender o reactivar'}
                >
                  <span>{selectedProduct?.status === 'SUSPENDIDO' ? '▶️' : '⏸️'}</span> 
                  {selectedProduct?.status === 'SUSPENDIDO' ? 'Reactivar' : 'Suspender'}
                </button>

                {/* BOTÓN ELIMINAR / INACTIVAR */}
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

            {/* MENSAJE DE CONFIRMACIÓN / TOAST LOCAL */}
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
                gap: '8px',
                animation: 'slideUp 0.2s ease'
              }}>
                <span>✅</span> {toastMessage}
              </div>
            )}

            {/* BARRA INFORMATIVA DE PRODUCTO SELECCIONADO */}
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
                  title="Quitar selección"
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
                  placeholder="Buscar producto por nombre, código de barra o código interno..." 
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
            </div>

            {/* TABLA GRID DE PRODUCTOS */}
            <div style={{ maxHeight: '460px', overflowY: 'auto', border: '1px solid var(--panel-border)', borderRadius: '14px' }}>
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
                  {productsLoading && (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '28px' }}>Cargando catálogo de la base de datos...</td></tr>
                  )}
                  {!productsLoading && filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                        No se encontraron productos registrados que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                  {!productsLoading && paginatedProducts.map(p => {
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
                        title="Haz clic para seleccionar este producto y habilitar Modificar o Suspender"
                      >
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="radio" 
                            name="selectedProductRadio"
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
                            <span style={{ marginLeft: '6px', fontSize: '0.68rem', background: '#fef7e0', color: '#b06000', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                              ⚖️ Balanza
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

            {/* ========================================================
                BARRA DE PAGINACIÓN PROFESIONAL MATERIAL 3
               ======================================================== */}
            {!productsLoading && totalItems > 0 && (
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
                {/* INFORMACIÓN DE REGISTROS */}
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Mostrando <strong style={{ color: 'var(--text-main)' }}>{totalItems > 0 ? startIndex + 1 : 0}</strong> a{' '}
                  <strong style={{ color: 'var(--text-main)' }}>{Math.min(startIndex + itemsPerPage, totalItems)}</strong> de{' '}
                  <strong style={{ color: 'var(--google-blue)' }}>{totalItems}</strong> productos
                </div>

                {/* SELECTOR DE FILAS POR PÁGINA Y CONTROLES DE PÁGINA */}
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

                  {/* BOTONES DE NAVEGACIÓN */}
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

                    {/* INDICADOR DE PÁGINA ACTUAL */}
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
        )}

        {/* 2. SUBMÓDULO: CLIENTES */}
        {activeTab === 'clientes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: 0, fontSize: '1.4rem' }}>
                  👥 Directorio de Clientes y Cuentas
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Base de datos de contribuyentes, consumidores finales y clientes a crédito.
                </p>
              </div>
              <button className="btn-quick-add" onClick={() => alert('Modal para registrar cliente')}>
                ＋ Nuevo Cliente
              </button>
            </div>

            {/* BUSCADOR */}
            <div className="search-bar-container" style={{ marginBottom: '18px' }}>
              <div className="search-input-wrapper">
                <span>🔍</span>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Buscar por nombre, RIF o Cédula de Identidad..." 
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
            </div>

            <table className="pos-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Documento</th>
                  <th>Razón Social / Nombre</th>
                  <th>Teléfono</th>
                  <th>Tipo Cliente</th>
                  <th>Dirección</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <tr key={c.id}>
                    <td className="code-col">{c.doc}</td>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.phone}</td>
                    <td>
                      <span style={{ background: '#e8f0fe', color: 'var(--google-blue)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {c.type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.address}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="Editar">✏️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. SUBMÓDULO: COMPRAS Y PROVEEDORES */}
        {activeTab === 'compras' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: 0, fontSize: '1.4rem' }}>
                  🛒 Gestión de Compras y Facturas de Proveedores
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Registro de facturas recibidas para alimentar automáticamente las existencias de stock.
                </p>
              </div>
              <button className="btn-quick-add" onClick={() => alert('Formulario de nueva compra')}>
                ＋ Registrar Factura de Compra
              </button>
            </div>

            {/* TARJETAS RESUMEN DE COMPRAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Proveedores Registrados</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--google-blue)' }}>32</div>
              </div>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Compras del Mes</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--google-green)' }}>14 Facturas</div>
              </div>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Invertido (USD)</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#202124', fontFamily: 'Orbitron, monospace' }}>$4,892.40</div>
              </div>
            </div>

            <h4 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Proveedores Principales del Catálogo:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div style={{ padding: '12px', border: '1px solid var(--panel-border)', borderRadius: '10px', fontSize: '0.85rem' }}>
                🏢 <strong>Alimentos Polar C.A.</strong> (Harinas, Pastas, Aceites)
              </div>
              <div style={{ padding: '12px', border: '1px solid var(--panel-border)', borderRadius: '10px', fontSize: '0.85rem' }}>
                🏢 <strong>Plumrose Latinoamericana</strong> (Embutidos y Charcutería)
              </div>
              <div style={{ padding: '12px', border: '1px solid var(--panel-border)', borderRadius: '10px', fontSize: '0.85rem' }}>
                🏢 <strong>Colgate-Palmolive</strong> (Cuidado Personal)
              </div>
              <div style={{ padding: '12px', border: '1px solid var(--panel-border)', borderRadius: '10px', fontSize: '0.85rem' }}>
                🏢 <strong>Nestlé Venezuela</strong> (Lácteos y Golosinas)
              </div>
            </div>
          </div>
        )}

        {/* 4. SUBMÓDULO: INVENTARIO Y ALMACENES */}
        {activeTab === 'inventario' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: 0, fontSize: '1.4rem' }}>
                  🏢 Control de Inventarios y Almacenes
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Existencias distribuidas por almacén físico, alertas de stock mínimo y ajustes.
                </p>
              </div>
              <button className="btn-quick-add" onClick={() => alert('Ajuste de inventario')}>
                ＋ Ajuste de Entrada / Salida
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Almacén Activo</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--google-blue)' }}>Almacén Principal</div>
              </div>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Artículos con Existencia</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--google-green)' }}>50 ítems</div>
              </div>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Alertas Stock Mínimo</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d93025' }}>0 alertas</div>
              </div>
            </div>
          </div>
        )}

        {/* 5. SUBMÓDULO: CATEGORÍAS Y MEDIDAS */}
        {activeTab === 'categorias' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: 0, fontSize: '1.4rem' }}>
                  🏷️ Departamentos, Categorías y Unidades
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Clasificación taxonómica de productos en la tabla <strong>inventario.categorias</strong>.
                </p>
              </div>
              <button className="btn-quick-add" onClick={() => alert('Nueva categoría')}>
                ＋ Nueva Categoría
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {['Alimentos', 'Bebidas', 'Carnicería y Pollería', 'Charcutería y Quesos', 'Cuidado Personal', 'Frutas y Verduras', 'Limpieza y Hogar', 'Lácteos y Refrigerados', 'Panadería y Repostería', 'Snacks y Golosinas'].map((cat, i) => (
                <div key={i} style={{ border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '14px', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat}</span>
                  <span style={{ background: '#e6f4ea', color: '#137333', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>Activo</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MODAL DE MODIFICACIÓN DE PRODUCTO */}
      <ProductEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        product={selectedProduct} 
        onSave={handleSaveEditedProduct} 
      />
    </div>
  );
}
