import React, { useState, useEffect } from 'react';
import { ProductModel } from '../models/ProductModel';
import { INITIAL_CUSTOMERS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import SubmoduleIcon from '../components/common/SubmoduleIcon';

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

  // Estado para Clientes
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [customerSearch, setCustomerSearch] = useState('');

  const [activeTab, setActiveTab] = useState('productos');

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: 0, fontSize: '1.4rem' }}>
                  📦 Catálogo Maestro de Productos
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Gestión integral de precios, códigos de barra, presentación y existencia.
                </p>
              </div>
              <button className="btn-quick-add" onClick={() => alert('Modal para crear nuevo producto')}>
                ＋ Nuevo Producto
              </button>
            </div>

            {/* BUSCADOR */}
            <div className="search-bar-container" style={{ marginBottom: '18px' }}>
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

            <div style={{ maxHeight: '520px', overflowY: 'auto', border: '1px solid var(--panel-border)', borderRadius: '14px' }}>
              <table className="pos-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>Código</th>
                    <th>Descripción</th>
                    <th style={{ width: '80px' }}>Unidad</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>Stock Total</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Precio Venta</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>IVA</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productsLoading && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>Cargando catálogo de la base de datos...</td></tr>
                  )}
                  {!productsLoading && filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No se encontraron productos registrados en el inventario.
                      </td>
                    </tr>
                  )}
                  {!productsLoading && filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td className="code-col">{p.code}</td>
                      <td>
                        <strong>{p.name}</strong>
                        {p.weightBased && (
                          <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: '#fef7e0', color: '#b06000', padding: '2px 6px', borderRadius: '4px' }}>
                            ⚖️ Balanza
                          </span>
                        )}
                      </td>
                      <td>{p.unit}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: p.stock > 10 ? 'var(--google-green)' : '#d93025' }}>
                        {p.stock}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'Orbitron, monospace', color: 'var(--google-blue)' }}>
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>{p.ivaRate > 0 ? `${(p.ivaRate * 100).toFixed(0)}%` : 'Exento'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '6px' }} title="Editar">✏️</button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="Historial">📈</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    </div>
  );
}
