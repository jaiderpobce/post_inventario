import React, { useState, useEffect } from 'react';
import { ProductModel } from '../models/ProductModel';
import { CustomerModel } from '../models/CustomerModel';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import SubmoduleIcon from '../components/common/SubmoduleIcon';
import ProductEditModal from '../components/product/ProductEditModal';
import ProductCreateModal from '../components/product/ProductCreateModal';
import CustomerCreateModal from '../components/customer/CustomerCreateModal';
import CustomerEditModal from '../components/customer/CustomerEditModal';
import PurchasesView from './PurchasesView';
import InventoryView from './InventoryView';
import apiClient from '../services/apiClient';

export default function AdministrationView() {
  const { getSubmodules } = useAuth();
  const { showSuccess, showError } = useNotification();
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Estado para Clientes
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerCurrentPage, setCustomerCurrentPage] = useState(1);
  const [customerItemsPerPage, setCustomerItemsPerPage] = useState(10);
  const [isCustomerCreateModalOpen, setIsCustomerCreateModalOpen] = useState(false);
  const [isCustomerEditModalOpen, setIsCustomerEditModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('productos');

  // Reset de página al buscar productos
  useEffect(() => {
    setCurrentPage(1);
    setSelectedProduct(null);
  }, [productSearch]);

  // Reset de página al buscar clientes
  useEffect(() => {
    setCustomerCurrentPage(1);
    setSelectedCustomer(null);
  }, [customerSearch]);

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

  // Carga inicial de clientes desde la base de datos
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setCustomersLoading(true);
        const res = await apiClient.get('/api/customers');
        if (res.ok) {
          setCustomers(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.warn('Error cargando clientes:', err);
      } finally {
        setCustomersLoading(false);
      }
    };
    loadCustomers();
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

    // Petición mediante el cliente unificado con procesamiento automático de respuestas
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
    const confirmed = window.confirm(`¿Seguro que desea eliminar o inactivar el producto "${selectedProduct.name}"?`);
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

  const handleProductCreated = (newProduct) => {
    setProducts(prev => [newProduct, ...prev]);
    setSelectedProduct(newProduct);
    setCurrentPage(1);
  };

  // Lógica de clientes
  const filteredCustomers = CustomerModel.filterCustomers(customers, customerSearch);
  const totalCustomerItems = filteredCustomers.length;
  const totalCustomerPages = Math.max(1, Math.ceil(totalCustomerItems / customerItemsPerPage));
  const customerStartIndex = (customerCurrentPage - 1) * customerItemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(customerStartIndex, customerStartIndex + customerItemsPerPage);

  const handleToggleCustomerSuspend = async () => {
    if (!selectedCustomer) return;
    const isSuspended = selectedCustomer.status === 'SUSPENDIDO';
    const newStatus = isSuspended ? 'ACTIVO' : 'SUSPENDIDO';

    const result = await apiClient.patch(`/api/customers/${selectedCustomer.id}/status`, { status: newStatus });
    if (result.ok) {
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, status: newStatus } : c));
      setSelectedCustomer(prev => prev ? { ...prev, status: newStatus } : null);
      showSuccess(result.message || `Cliente "${selectedCustomer.name}" ${isSuspended ? 'reactivado' : 'suspendido'} exitosamente`);
    } else {
      showError(result.message, 'Fallo al cambiar estado');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    const confirmed = window.confirm(`¿Seguro que desea inactivar o eliminar al cliente "${selectedCustomer.name}"?`);
    if (!confirmed) return;

    const result = await apiClient.delete(`/api/customers/${selectedCustomer.id}`);
    if (result.ok) {
      setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
      setSelectedCustomer(null);
      showSuccess(result.message || `Cliente "${selectedCustomer.name}" eliminado del catálogo`);
    } else {
      showError(result.message, 'Fallo al eliminar cliente');
    }
  };

  const handleSaveEditedCustomer = (updated) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelectedCustomer(updated);
  };

  const handleCustomerCreated = (newCustomer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    setSelectedCustomer(newCustomer);
    setCustomerCurrentPage(1);
  };

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
                  onClick={() => setIsCreateModalOpen(true)}
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
            {/* ENCABEZADO Y BOTONES DE ACCIÓN */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.4rem' }}>
                  👥 Directorio de Clientes y Cuentas
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Base de datos de contribuyentes, consumidores finales y clientes a crédito.
                </p>
              </div>

              {/* BOTONERA DE ACCIONES UNIFORME */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn-quick-add" 
                  onClick={() => setIsCustomerCreateModalOpen(true)}
                  title="Registrar un nuevo cliente en el directorio"
                >
                  ＋ Nuevo Cliente
                </button>

                {/* BOTÓN MODIFICAR */}
                <button
                  onClick={() => setIsCustomerEditModalOpen(true)}
                  disabled={!selectedCustomer}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: '1px solid ' + (selectedCustomer ? 'var(--google-blue)' : 'var(--panel-border)'),
                    background: selectedCustomer ? '#e8f0fe' : '#f1f3f4',
                    color: selectedCustomer ? 'var(--google-blue)' : '#9aa0a6',
                    cursor: selectedCustomer ? 'pointer' : 'not-allowed',
                    transition: 'var(--transition)'
                  }}
                  title={selectedCustomer ? `Modificar ${selectedCustomer.name}` : 'Seleccione un cliente para modificar'}
                >
                  <span>✏️</span> Modificar
                </button>

                {/* BOTÓN SUSPENDER / REACTIVAR */}
                <button
                  onClick={handleToggleCustomerSuspend}
                  disabled={!selectedCustomer}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: '1px solid ' + (selectedCustomer ? '#f9ab00' : 'var(--panel-border)'),
                    background: selectedCustomer ? '#fef7e0' : '#f1f3f4',
                    color: selectedCustomer ? '#b06000' : '#9aa0a6',
                    cursor: selectedCustomer ? 'pointer' : 'not-allowed',
                    transition: 'var(--transition)'
                  }}
                  title={selectedCustomer ? (selectedCustomer.status === 'SUSPENDIDO' ? 'Reactivar cliente' : 'Suspender cliente') : 'Seleccione un cliente para suspender o reactivar'}
                >
                  <span>{selectedCustomer?.status === 'SUSPENDIDO' ? '▶️' : '⏸️'}</span> 
                  {selectedCustomer?.status === 'SUSPENDIDO' ? 'Reactivar' : 'Suspender'}
                </button>

                {/* BOTÓN ELIMINAR */}
                <button
                  onClick={handleDeleteCustomer}
                  disabled={!selectedCustomer}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: '1px solid ' + (selectedCustomer ? '#ea4335' : 'var(--panel-border)'),
                    background: selectedCustomer ? '#fce8e6' : '#f1f3f4',
                    color: selectedCustomer ? '#c5221f' : '#9aa0a6',
                    cursor: selectedCustomer ? 'pointer' : 'not-allowed',
                    transition: 'var(--transition)'
                  }}
                  title={selectedCustomer ? `Eliminar ${selectedCustomer.name}` : 'Seleccione un cliente para eliminar'}
                >
                  <span>🗑️</span> Eliminar
                </button>
              </div>
            </div>

            {/* BARRA INFORMATIVA DE SELECCIÓN */}
            {selectedCustomer && (
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
                  <span className="code-col" style={{ fontWeight: 700 }}>{selectedCustomer.doc}</span>
                  <strong style={{ color: 'var(--text-main)' }}>{selectedCustomer.name}</strong>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <span>Tel: <strong>{selectedCustomer.phone || 'N/A'}</strong></span>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <span>Crédito: <strong style={{ color: 'var(--google-blue)' }}>${Number(selectedCustomer.creditLimit || 0).toFixed(2)}</strong></span>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '6px', 
                    fontSize: '0.72rem', 
                    fontWeight: 800,
                    background: selectedCustomer.status === 'SUSPENDIDO' ? '#fef7e0' : '#e6f4ea',
                    color: selectedCustomer.status === 'SUSPENDIDO' ? '#b06000' : '#137333'
                  }}>
                    {selectedCustomer.status || 'ACTIVO'}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)} 
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
                  placeholder="Buscar por nombre, RIF, cédula, teléfono o correo..." 
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
            </div>

            {/* TABLA GRID DE CLIENTES */}
            <div style={{ maxHeight: '480px', overflowY: 'auto', border: '1px solid var(--panel-border)', borderRadius: '14px' }}>
              <table className="pos-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>Sel</th>
                    <th style={{ width: '130px' }}>RIF / Cédula</th>
                    <th>Nombre / Razón Social</th>
                    <th style={{ width: '120px' }}>Teléfono</th>
                    <th>Correo Electrónico</th>
                    <th style={{ width: '160px' }}>Tipo Cliente</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Límite Crédito ($)</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {customersLoading && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '28px' }}>
                        Cargando directorio de clientes desde la base de datos...
                      </td>
                    </tr>
                  )}
                  {!customersLoading && filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                        No se encontraron clientes coincidentes con el criterio de búsqueda.
                      </td>
                    </tr>
                  )}
                  {!customersLoading && paginatedCustomers.map(c => {
                    const isSelected = selectedCustomer?.id === c.id;
                    const isSuspended = c.status === 'SUSPENDIDO';

                    return (
                      <tr 
                        key={c.id}
                        onClick={() => setSelectedCustomer(isSelected ? null : c)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#e8f0fe' : (isSuspended ? '#fffdf5' : '#ffffff'),
                          boxShadow: isSelected ? 'inset 3px 0 0 var(--google-blue)' : undefined,
                          transition: 'background-color 0.15s ease'
                        }}
                        title="Haz clic para seleccionar este cliente"
                      >
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="radio" 
                            name="adminCustomersRadio"
                            checked={isSelected}
                            onChange={() => setSelectedCustomer(isSelected ? null : c)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td className="code-col" style={{ fontWeight: 600 }}>{c.doc}</td>
                        <td>
                          <span style={{ fontWeight: isSelected ? 700 : 500, color: isSuspended ? 'var(--text-muted)' : 'var(--text-main)' }}>
                            {c.name}
                          </span>
                          {c.address && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                              📍 {c.address}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.84rem' }}>{c.phone || '—'}</td>
                        <td style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{c.email || '—'}</td>
                        <td>
                          <span style={{
                            background: '#f1f3f4',
                            color: '#5f6368',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 600
                          }}>
                            {c.type || 'Consumidor Final'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'Orbitron, monospace', color: 'var(--google-blue)' }}>
                          ${Number(c.creditLimit || 0).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: isSuspended ? '#fef7e0' : (c.status === 'INACTIVO' ? '#fce8e6' : '#e6f4ea'),
                            color: isSuspended ? '#b06000' : (c.status === 'INACTIVO' ? '#c5221f' : '#137333')
                          }}>
                            {c.status || 'ACTIVO'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* BARRA DE PAGINACIÓN */}
            {!customersLoading && totalCustomerItems > 0 && (
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
                  Mostrando <strong style={{ color: 'var(--text-main)' }}>{totalCustomerItems > 0 ? customerStartIndex + 1 : 0}</strong> a{' '}
                  <strong style={{ color: 'var(--text-main)' }}>{Math.min(customerStartIndex + customerItemsPerPage, totalCustomerItems)}</strong> de{' '}
                  <strong style={{ color: 'var(--google-blue)' }}>{totalCustomerItems}</strong> clientes
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span>Filas por página:</span>
                    <select
                      value={customerItemsPerPage}
                      onChange={(e) => {
                        setCustomerItemsPerPage(Number(e.target.value));
                        setCustomerCurrentPage(1);
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
                      onClick={() => setCustomerCurrentPage(1)}
                      disabled={customerCurrentPage === 1}
                      style={{
                        padding: '5px 9px',
                        borderRadius: '8px',
                        border: '1px solid var(--panel-border)',
                        background: '#ffffff',
                        cursor: customerCurrentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: customerCurrentPage === 1 ? 0.4 : 1,
                        fontSize: '0.8rem'
                      }}
                      title="Primera página"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCustomerCurrentPage(p => Math.max(1, p - 1))}
                      disabled={customerCurrentPage === 1}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--panel-border)',
                        background: '#ffffff',
                        cursor: customerCurrentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: customerCurrentPage === 1 ? 0.4 : 1,
                        fontSize: '0.8rem'
                      }}
                      title="Página anterior"
                    >
                      ‹ Anterior
                    </button>

                    <span style={{ fontSize: '0.84rem', fontWeight: 700, padding: '0 8px', color: 'var(--google-blue)' }}>
                      Página {customerCurrentPage} de {totalCustomerPages}
                    </span>

                    <button
                      onClick={() => setCustomerCurrentPage(p => Math.min(totalCustomerPages, p + 1))}
                      disabled={customerCurrentPage === totalCustomerPages}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--panel-border)',
                        background: '#ffffff',
                        cursor: customerCurrentPage === totalCustomerPages ? 'not-allowed' : 'pointer',
                        opacity: customerCurrentPage === totalCustomerPages ? 0.4 : 1,
                        fontSize: '0.8rem'
                      }}
                      title="Página siguiente"
                    >
                      Siguiente ›
                    </button>
                    <button
                      onClick={() => setCustomerCurrentPage(totalCustomerPages)}
                      disabled={customerCurrentPage === totalCustomerPages}
                      style={{
                        padding: '5px 9px',
                        borderRadius: '8px',
                        border: '1px solid var(--panel-border)',
                        background: '#ffffff',
                        cursor: customerCurrentPage === totalCustomerPages ? 'not-allowed' : 'pointer',
                        opacity: customerCurrentPage === totalCustomerPages ? 0.4 : 1,
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

        {/* 3. SUBMÓDULO: COMPRAS Y PROVEEDORES */}
        {activeTab === 'compras' && (
          <PurchasesView embedded={true} />
        )}

        {/* 4. SUBMÓDULO: INVENTARIO Y ALMACENES */}
        {activeTab === 'inventario' && (
          <InventoryView embedded={true} />
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

      {/* MODAL DE CREACIÓN DE PRODUCTO */}
      <ProductCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProductCreated={handleProductCreated}
      />

      {/* MODAL DE CREACIÓN DE CLIENTE */}
      <CustomerCreateModal
        isOpen={isCustomerCreateModalOpen}
        onClose={() => setIsCustomerCreateModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />

      {/* MODAL DE MODIFICACIÓN DE CLIENTE */}
      <CustomerEditModal
        isOpen={isCustomerEditModalOpen}
        onClose={() => setIsCustomerEditModalOpen(false)}
        customer={selectedCustomer}
        onSave={handleSaveEditedCustomer}
      />
    </div>
  );
}
