import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import InventoryAdjustmentModal from '../components/inventory/InventoryAdjustmentModal';
import apiClient from '../services/apiClient';

export default function InventoryView({ embedded = false }) {
  const { showSuccess, showError } = useNotification();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    const result = await apiClient.get('/api/inventory');
    setLoading(false);
    if (result.ok) {
      setInventory(Array.isArray(result.data) ? result.data : []);
      setError('');
    } else {
      setError(result.message);
      showError(result.message, 'Control de Inventario');
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedItem(null);
  }, [searchTerm]);

  const filtered = inventory.filter(it => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      (it.productName && it.productName.toLowerCase().includes(q)) ||
      (it.barcode && it.barcode.toLowerCase().includes(q)) ||
      (it.internalCode && it.internalCode.toLowerCase().includes(q)) ||
      (it.categoryName && it.categoryName.toLowerCase().includes(q))
    );
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Métricas
  const totalValuation = inventory.reduce((acc, it) => acc + (parseFloat(it.valuation) || 0), 0);
  const lowStockCount = inventory.filter(it => it.stockAlert === 'BAJO_STOCK' || it.stockAlert === 'AGOTADO').length;

  const handleAdjustmentSuccess = (adjusted) => {
    setInventory(prev => prev.map(it => {
      if (it.productId === adjusted.productId) {
        const newStock = parseFloat(adjusted.newStock) || 0;
        const cost = parseFloat(it.costPrice) || 0;
        const min = parseFloat(it.minStock) || 0;
        let alert = 'NORMAL';
        if (newStock <= 0) alert = 'AGOTADO';
        else if (min > 0 && newStock <= min) alert = 'BAJO_STOCK';

        return {
          ...it,
          currentStock: newStock,
          valuation: newStock * cost,
          stockAlert: alert
        };
      }
      return it;
    }));
    fetchInventory();
  };

  const getAlertBadgeStyle = (alert) => {
    switch (alert) {
      case 'AGOTADO':
        return { background: '#fce8e6', color: '#c5221f', label: 'Agotado' };
      case 'BAJO_STOCK':
        return { background: '#fef7e0', color: '#b06000', label: 'Bajo Stock' };
      default:
        return { background: '#e6f4ea', color: '#137333', label: 'Óptimo' };
    }
  };

  return (
    <div style={embedded ? { width: '100%' } : { padding: '24px', maxWidth: '1400px', margin: '0 auto', flex: 1, width: '100%' }}>
      <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '20px', padding: '28px', boxShadow: 'var(--shadow-main)' }}>
        
        {/* ENCABEZADO Y ACCIONES */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.4rem' }}>
              🏢 Control de Inventarios y Almacenes
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.88rem' }}>
              Monitoreo de existencias por almacén físico, valuación de activos y registro kardex.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn-quick-add" 
              onClick={() => setIsAdjustModalOpen(true)}
            >
              ＋ Ajuste de Stock
            </button>

            <button
              onClick={fetchInventory}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid var(--panel-border)',
                background: '#ffffff',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
              title="Recargar datos de existencias"
            >
              <span>🔄</span> Actualizar
            </button>
          </div>
        </div>

        {/* TARJETAS RESUMEN DE INDICADORES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '18px' }}>
          <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '16px', background: '#f8f9fa' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>Valuación Total de Mercancía</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--google-blue)', fontFamily: 'Orbitron, monospace', marginTop: '4px' }}>
              ${totalValuation.toFixed(2)}
            </div>
          </div>
          <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '16px', background: '#f8f9fa' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>Artículos en Catálogo</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              {inventory.length} productos
            </div>
          </div>
          <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '16px', background: '#f8f9fa' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>Alertas de Reposición</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: lowStockCount > 0 ? '#d93025' : 'var(--google-green)', marginTop: '4px' }}>
              {lowStockCount} {lowStockCount === 1 ? 'alerta' : 'alertas'}
            </div>
          </div>
        </div>

        {/* BARRA INFORMATIVA DE SELECCIÓN */}
        {selectedItem && (
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
              <span className="code-col" style={{ fontWeight: 700 }}>{selectedItem.barcode || selectedItem.internalCode}</span>
              <strong style={{ color: 'var(--text-main)' }}>{selectedItem.productName}</strong>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>Almacén: <strong>{selectedItem.warehouseName}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>Existencia: <strong style={{ color: 'var(--google-blue)' }}>{selectedItem.currentStock} {selectedItem.unit}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>Valuación: <strong style={{ color: 'var(--google-green)' }}>${Number(selectedItem.valuation || 0).toFixed(2)}</strong></span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={() => setIsAdjustModalOpen(true)}
                style={{ background: 'var(--google-blue)', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
              >
                ⚖️ Ajustar
              </button>
              <button 
                onClick={() => setSelectedItem(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--google-blue)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
              >
                ✕ Deseleccionar
              </button>
            </div>
          </div>
        )}

        {/* BUSCADOR */}
        <div className="search-bar-container" style={{ marginBottom: '16px' }}>
          <div className="search-input-wrapper">
            <span>🔍</span>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar por código, descripción de producto, marca o categoría..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TABLA GRID DE INVENTARIO */}
        <div style={{ maxHeight: '480px', overflowY: 'auto', border: '1px solid var(--panel-border)', borderRadius: '14px' }}>
          <table className="pos-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>Sel</th>
                <th style={{ width: '130px' }}>Código</th>
                <th>Descripción del Producto</th>
                <th style={{ width: '140px' }}>Categoría</th>
                <th style={{ width: '140px' }}>Almacén</th>
                <th style={{ width: '110px', textAlign: 'right' }}>Stock Actual</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Mínimo</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Valuación ($)</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '28px' }}>
                    Cargando existencias de inventario desde la base de datos...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: '#c5221f', padding: '28px' }}>
                    ⚠️ {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                    No se encontraron productos coincidentes en el inventario.
                  </td>
                </tr>
              )}
              {!loading && !error && paginated.map(it => {
                const isSelected = selectedItem?.productId === it.productId;
                const badge = getAlertBadgeStyle(it.stockAlert);
                const isCritical = it.stockAlert === 'AGOTADO' || it.stockAlert === 'BAJO_STOCK';

                return (
                  <tr 
                    key={it.productId}
                    onClick={() => setSelectedItem(isSelected ? null : it)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#e8f0fe' : (isCritical ? '#fffdf5' : '#ffffff'),
                      boxShadow: isSelected ? 'inset 3px 0 0 var(--google-blue)' : undefined,
                      transition: 'background-color 0.15s ease'
                    }}
                    title="Haz clic para seleccionar este producto en almacén"
                  >
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="radio" 
                        name="inventoryRadio"
                        checked={isSelected}
                        onChange={() => setSelectedItem(isSelected ? null : it)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td className="code-col" style={{ fontWeight: 600 }}>{it.barcode || it.internalCode}</td>
                    <td>
                      <span style={{ fontWeight: isSelected ? 700 : 500, color: 'var(--text-main)' }}>
                        {it.productName}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{it.categoryName}</td>
                    <td style={{ fontSize: '0.82rem' }}>{it.warehouseName}</td>
                    <td style={{ 
                      textAlign: 'right', 
                      fontWeight: 800, 
                      color: it.currentStock > 10 ? 'var(--google-green)' : (it.currentStock <= 0 ? '#c5221f' : '#b06000') 
                    }}>
                      {Number(it.currentStock).toFixed(2)} <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{it.unit}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {Number(it.minStock || 0).toFixed(0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'Orbitron, monospace', color: 'var(--google-blue)' }}>
                      ${Number(it.valuation || 0).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: badge.background,
                        color: badge.color
                      }}>
                        {badge.label}
                      </span>
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
              <strong style={{ color: 'var(--google-blue)' }}>{totalItems}</strong> artículos
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

      {/* MODAL AJUSTE DE INVENTARIO */}
      <InventoryAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        selectedProduct={selectedItem}
        onAdjustmentSuccess={handleAdjustmentSuccess}
      />
    </div>
  );
}
