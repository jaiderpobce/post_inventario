import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import PurchaseCreateModal from '../components/purchase/PurchaseCreateModal';
import PurchaseDetailModal from '../components/purchase/PurchaseDetailModal';
import apiClient from '../services/apiClient';

export default function PurchasesView({ embedded = false }) {
  const { showSuccess, showError } = useNotification();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchPurchases = async () => {
    setLoading(true);
    const result = await apiClient.get('/api/purchases');
    setLoading(false);
    if (result.ok) {
      setPurchases(Array.isArray(result.data) ? result.data : []);
      setError('');
    } else {
      setError(result.message);
      showError(result.message, 'Gestión de Compras');
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedPurchase(null);
  }, [searchTerm]);

  const filtered = purchases.filter(p => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(q)) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    );
  });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const totalSpent = purchases
    .filter(p => p.status !== 'ANULADA')
    .reduce((acc, p) => acc + (parseFloat(p.total) || 0), 0);

  const uniqueSuppliersCount = new Set(purchases.map(p => p.supplierId)).size;

  const handleToggleAnular = async () => {
    if (!selectedPurchase) return;
    const isAnulada = selectedPurchase.status === 'ANULADA';
    const newStatus = isAnulada ? 'COMPLETADA' : 'ANULADA';

    const confirmed = window.confirm(`¿Seguro que desea ${isAnulada ? 'reactivar' : 'anular'} la factura ${selectedPurchase.invoiceNumber}?`);
    if (!confirmed) return;

    const result = await apiClient.patch(`/api/purchases/${selectedPurchase.id}/status`, { status: newStatus });
    if (result.ok) {
      setPurchases(prev => prev.map(p => p.id === selectedPurchase.id ? { ...p, status: newStatus } : p));
      setSelectedPurchase(prev => prev ? { ...prev, status: newStatus } : null);
      showSuccess(result.message || `Factura ${selectedPurchase.invoiceNumber} ${isAnulada ? 'reactivada' : 'anulada'}`);
    } else {
      showError(result.message, 'Fallo al cambiar estado');
    }
  };

  const handlePurchaseCreated = (newPurchase) => {
    if (newPurchase) {
      setPurchases(prev => [newPurchase, ...prev]);
      setSelectedPurchase(newPurchase);
      setCurrentPage(1);
    } else {
      fetchPurchases();
    }
  };

  return (
    <div style={embedded ? { width: '100%' } : { padding: '24px', maxWidth: '1400px', margin: '0 auto', flex: 1, width: '100%' }}>
      <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '20px', padding: '28px', boxShadow: 'var(--shadow-main)' }}>
        
        {/* ENCABEZADO Y BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.4rem' }}>
              🛒 Gestión de Compras y Proveedores
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.88rem' }}>
              Control de facturas de compras, recepción de mercancía y reposición de stock.
            </p>
          </div>

          {/* BOTONERA UNIFORME */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn-quick-add" 
              onClick={() => setIsCreateModalOpen(true)}
            >
              ＋ Registrar Compra
            </button>

            {/* BOTÓN VER DETALLE */}
            <button
              onClick={() => setIsDetailModalOpen(true)}
              disabled={!selectedPurchase}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid ' + (selectedPurchase ? 'var(--google-blue)' : 'var(--panel-border)'),
                background: selectedPurchase ? '#e8f0fe' : '#f1f3f4',
                color: selectedPurchase ? 'var(--google-blue)' : '#9aa0a6',
                cursor: selectedPurchase ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)'
              }}
              title={selectedPurchase ? 'Ver ítems y desglose de la factura' : 'Seleccione una factura para ver detalle'}
            >
              <span>📋</span> Ver Detalle
            </button>

            {/* BOTÓN ANULAR */}
            <button
              onClick={handleToggleAnular}
              disabled={!selectedPurchase}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid ' + (selectedPurchase ? '#ea4335' : 'var(--panel-border)'),
                background: selectedPurchase ? '#fce8e6' : '#f1f3f4',
                color: selectedPurchase ? '#c5221f' : '#9aa0a6',
                cursor: selectedPurchase ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)'
              }}
              title={selectedPurchase ? (selectedPurchase.status === 'ANULADA' ? 'Reactivar factura' : 'Anular factura de compra') : 'Seleccione una factura para anular'}
            >
              <span>{selectedPurchase?.status === 'ANULADA' ? '▶️' : '🚫'}</span> 
              {selectedPurchase?.status === 'ANULADA' ? 'Reactivar' : 'Anular'}
            </button>
          </div>
        </div>

        {/* TARJETAS RESUMEN DE INDICADORES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '18px' }}>
          <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '16px', background: '#f8f9fa' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>Facturas Registradas</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--google-blue)', marginTop: '4px' }}>
              {purchases.length}
            </div>
          </div>
          <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '16px', background: '#f8f9fa' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Invertido en Mercancía</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--google-green)', fontFamily: 'Orbitron, monospace', marginTop: '4px' }}>
              ${totalSpent.toFixed(2)}
            </div>
          </div>
          <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '16px', background: '#f8f9fa' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>Proveedores con Movimientos</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              {uniqueSuppliersCount}
            </div>
          </div>
        </div>

        {/* BARRA INFORMATIVA DE SELECCIÓN */}
        {selectedPurchase && (
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
              <span style={{ fontWeight: 800, color: 'var(--google-blue)' }}>Seleccionada:</span>
              <span className="code-col" style={{ fontWeight: 700 }}>{selectedPurchase.invoiceNumber}</span>
              <strong style={{ color: 'var(--text-main)' }}>{selectedPurchase.supplierName}</strong>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>Total: <strong style={{ color: 'var(--google-blue)', fontFamily: 'Orbitron, monospace' }}>${Number(selectedPurchase.total).toFixed(2)}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>Ítems: <strong>{selectedPurchase.itemsCount}</strong></span>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '6px', 
                fontSize: '0.72rem', 
                fontWeight: 800,
                background: selectedPurchase.status === 'ANULADA' ? '#fce8e6' : '#e6f4ea',
                color: selectedPurchase.status === 'ANULADA' ? '#c5221f' : '#137333'
              }}>
                {selectedPurchase.status || 'COMPLETADA'}
              </span>
            </div>
            <button 
              onClick={() => setSelectedPurchase(null)} 
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
              placeholder="Buscar por N° de factura, nombre de proveedor o notas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TABLA GRID DE COMPRAS */}
        <div style={{ maxHeight: '480px', overflowY: 'auto', border: '1px solid var(--panel-border)', borderRadius: '14px' }}>
          <table className="pos-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>Sel</th>
                <th style={{ width: '140px' }}>N° Factura</th>
                <th>Proveedor Distribuidor</th>
                <th style={{ width: '160px' }}>Fecha y Hora</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Productos</th>
                <th style={{ width: '130px', textAlign: 'right' }}>Total ($)</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '28px' }}>
                    Cargando facturas de compra desde la base de datos...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#c5221f', padding: '28px' }}>
                    ⚠️ {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                    No se encontraron facturas de compra registradas.
                  </td>
                </tr>
              )}
              {!loading && !error && paginated.map(p => {
                const isSelected = selectedPurchase?.id === p.id;
                const isAnulada = p.status === 'ANULADA';

                return (
                  <tr 
                    key={p.id}
                    onClick={() => setSelectedPurchase(isSelected ? null : p)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#e8f0fe' : (isAnulada ? '#fff5f5' : '#ffffff'),
                      boxShadow: isSelected ? 'inset 3px 0 0 var(--google-blue)' : undefined,
                      transition: 'background-color 0.15s ease'
                    }}
                    title="Haz clic para seleccionar esta compra"
                  >
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="radio" 
                        name="purchasesViewRadio"
                        checked={isSelected}
                        onChange={() => setSelectedPurchase(isSelected ? null : p)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td className="code-col" style={{ fontWeight: 600 }}>{p.invoiceNumber}</td>
                    <td>
                      <span style={{ fontWeight: isSelected ? 700 : 500, color: isAnulada ? 'var(--text-muted)' : 'var(--text-main)' }}>
                        {p.supplierName}
                      </span>
                      {p.notes && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '340px' }}>
                          📝 {p.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{p.purchaseDate}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.84rem' }}>
                      {p.itemsCount} {p.itemsCount === 1 ? 'ítem' : 'ítems'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, fontFamily: 'Orbitron, monospace', color: isAnulada ? 'var(--text-muted)' : 'var(--google-blue)' }}>
                      ${Number(p.total).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: isAnulada ? '#fce8e6' : '#e6f4ea',
                        color: isAnulada ? '#c5221f' : '#137333'
                      }}>
                        {p.status || 'COMPLETADA'}
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
              <strong style={{ color: 'var(--google-blue)' }}>{totalItems}</strong> facturas
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

      {/* MODAL REGISTRAR COMPRA */}
      <PurchaseCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPurchaseCreated={handlePurchaseCreated}
      />

      {/* MODAL DETALLE DE COMPRA */}
      <PurchaseDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        purchaseId={selectedPurchase?.id}
      />
    </div>
  );
}
