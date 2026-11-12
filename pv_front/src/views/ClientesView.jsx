import React, { useState, useEffect } from 'react';
import { CustomerModel } from '../models/CustomerModel';
import { useNotification } from '../context/NotificationContext';
import CustomerCreateModal from '../components/customer/CustomerCreateModal';
import CustomerEditModal from '../components/customer/CustomerEditModal';
import apiClient from '../services/apiClient';

export default function ClientesView() {
  const { showSuccess, showError } = useNotification();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    const result = await apiClient.get('/api/customers');
    setLoading(false);
    if (result.ok) {
      setCustomers(Array.isArray(result.data) ? result.data : []);
      setError('');
    } else {
      setError(result.message);
      showError(result.message, 'Directorio de Clientes');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedCustomer(null);
  }, [searchTerm]);

  const filtered = CustomerModel.filterCustomers(customers, searchTerm);
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleToggleSuspend = async () => {
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
      showSuccess(result.message || `Cliente "${selectedCustomer.name}" eliminado del directorio`);
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
    setCurrentPage(1);
  };

  const getTypeBadgeStyle = (type) => {
    switch (type) {
      case 'Contribuyente Especial':
        return { background: '#fef7e0', color: '#b06000', border: '1px solid #f9ab00' };
      case 'Cliente VIP / Crédito':
        return { background: '#f3e8fd', color: '#8430ce', border: '1px solid #d2a4f9' };
      case 'Gobierno / Institucional':
        return { background: '#e8f0fe', color: '#1a73e8', border: '1px solid #aecbfa' };
      default:
        return { background: '#f1f3f4', color: '#5f6368', border: '1px solid #dadce0' };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', flex: 1, width: '100%' }}>
      <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '20px', padding: '28px', boxShadow: 'var(--shadow-main)' }}>
        
        {/* ENCABEZADO Y BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.4rem' }}>
              👥 Catálogo y Directorio de Clientes
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.88rem' }}>
              Gestión centralizada de contribuyentes, datos fiscales, límites de crédito y cuentas comerciales.
            </p>
          </div>

          {/* BOTONERA DE ACCIONES UNIFORME */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn-quick-add" 
              onClick={() => setIsCreateModalOpen(true)}
            >
              ＋ Nuevo Cliente
            </button>

            {/* BOTÓN MODIFICAR */}
            <button
              onClick={() => setIsEditModalOpen(true)}
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
              onClick={handleToggleSuspend}
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
              title={selectedCustomer ? (selectedCustomer.status === 'SUSPENDIDO' ? 'Reactivar cliente' : 'Suspender crédito/operaciones') : 'Seleccione un cliente para suspender o reactivar'}
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
              placeholder="Buscar por RIF, cédula, nombre o razón social, teléfono o correo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              {loading && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '28px' }}>
                    Cargando directorio de clientes desde la base de datos...
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
                    No se encontraron clientes coincidentes con el criterio de búsqueda.
                  </td>
                </tr>
              )}
              {!loading && !error && paginated.map(c => {
                const isSelected = selectedCustomer?.id === c.id;
                const isSuspended = c.status === 'SUSPENDIDO';
                const typeStyle = getTypeBadgeStyle(c.type);

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
                        name="customersViewRadio"
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
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>
                          📍 {c.address}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.84rem' }}>{c.phone || '—'}</td>
                    <td style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{c.email || '—'}</td>
                    <td>
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        ...typeStyle
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
              <strong style={{ color: 'var(--google-blue)' }}>{totalItems}</strong> clientes
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

      {/* MODAL CREAR CLIENTE */}
      <CustomerCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />

      {/* MODAL EDITAR CLIENTE */}
      <CustomerEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customer={selectedCustomer}
        onSave={handleSaveEditedCustomer}
      />
    </div>
  );
}
