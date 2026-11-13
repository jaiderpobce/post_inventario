import React, { useState, useEffect } from 'react';
import { UserModel } from '../models/UserModel';
import { useNotification } from '../context/NotificationContext';
import UserCreateModal from '../components/user/UserCreateModal';
import UserEditModal from '../components/user/UserEditModal';
import apiClient from '../services/apiClient';

export default function UsuariosView() {
  const { showSuccess, showError } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const result = await apiClient.get('/api/users');
    setLoading(false);
    if (result.ok) {
      setUsers(Array.isArray(result.data) ? result.data : []);
      setError('');
    } else {
      setError(result.message);
      showError(result.message, 'Gestión de Usuarios');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedUser(null);
  }, [searchTerm]);

  const filtered = UserModel.filterUsers(users, searchTerm);
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleToggleSuspend = async () => {
    if (!selectedUser) return;
    if (selectedUser.id === 1) {
      showError('No se puede suspender al Super Administrador principal', 'Seguridad RBAC');
      return;
    }

    const isSuspended = selectedUser.status === 'SUSPENDIDO' || !selectedUser.active;
    const newStatus = isSuspended ? 'ACTIVO' : 'SUSPENDIDO';

    const result = await apiClient.patch(`/api/users/${selectedUser.id}/status`, { status: newStatus });
    if (result.ok) {
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status: newStatus, active: newStatus === 'ACTIVO' } : u));
      setSelectedUser(prev => prev ? { ...prev, status: newStatus, active: newStatus === 'ACTIVO' } : null);
      showSuccess(result.message || `Usuario "${selectedUser.name}" ${isSuspended ? 'reactivado' : 'suspendido'} exitosamente`);
    } else {
      showError(result.message, 'Fallo al cambiar estado');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (selectedUser.id === 1) {
      showError('No se puede eliminar la cuenta principal de Super Administrador', 'Seguridad RBAC');
      return;
    }

    const confirmed = window.confirm(`¿Seguro que desea inactivar / suspender la cuenta del usuario "${selectedUser.name}"?`);
    if (!confirmed) return;

    const result = await apiClient.delete(`/api/users/${selectedUser.id}`);
    if (result.ok) {
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status: 'SUSPENDIDO', active: false } : u));
      setSelectedUser(prev => prev ? { ...prev, status: 'SUSPENDIDO', active: false } : null);
      showSuccess(result.message || `Usuario "${selectedUser.name}" inactivado del sistema`);
    } else {
      showError(result.message, 'Fallo al inactivar usuario');
    }
  };

  const handleSaveEditedUser = (updated) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setSelectedUser(updated);
  };

  const handleUserCreated = (newUser) => {
    setUsers(prev => [newUser, ...prev]);
    setSelectedUser(newUser);
    setCurrentPage(1);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', flex: 1, width: '100%' }}>
      <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '20px', padding: '28px', boxShadow: 'var(--shadow-main)' }}>
        
        {/* ENCABEZADO Y BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.4rem' }}>
              👥 Gestión de Usuarios y Cuentas (RBAC)
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.88rem' }}>
              Control de operadores, cajeros, credenciales de acceso y permisos gobernados por <strong>pos_rbac</strong>.
            </p>
          </div>

          {/* BOTONERA DE ACCIONES UNIFORME */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn-quick-add" 
              onClick={() => setIsCreateModalOpen(true)}
            >
              ＋ Nuevo Usuario
            </button>

            {/* BOTÓN MODIFICAR */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              disabled={!selectedUser}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid ' + (selectedUser ? 'var(--google-blue)' : 'var(--panel-border)'),
                background: selectedUser ? '#e8f0fe' : '#f1f3f4',
                color: selectedUser ? 'var(--google-blue)' : '#9aa0a6',
                cursor: selectedUser ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)'
              }}
              title={selectedUser ? `Modificar ${selectedUser.name}` : 'Seleccione un usuario para modificar'}
            >
              <span>✏️</span> Modificar
            </button>

            {/* BOTÓN SUSPENDER / REACTIVAR */}
            <button
              onClick={handleToggleSuspend}
              disabled={!selectedUser || selectedUser.id === 1}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid ' + (selectedUser && selectedUser.id !== 1 ? '#f9ab00' : 'var(--panel-border)'),
                background: selectedUser && selectedUser.id !== 1 ? '#fef7e0' : '#f1f3f4',
                color: selectedUser && selectedUser.id !== 1 ? '#b06000' : '#9aa0a6',
                cursor: selectedUser && selectedUser.id !== 1 ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)'
              }}
              title={selectedUser ? (selectedUser.id === 1 ? 'El Superadmin no se puede suspender' : (selectedUser.status === 'SUSPENDIDO' ? 'Reactivar usuario' : 'Suspender acceso')) : 'Seleccione un usuario para suspender o reactivar'}
            >
              <span>{selectedUser?.status === 'SUSPENDIDO' ? '▶️' : '⏸️'}</span> 
              {selectedUser?.status === 'SUSPENDIDO' ? 'Reactivar' : 'Suspender'}
            </button>

            {/* BOTÓN ELIMINAR */}
            <button
              onClick={handleDeleteUser}
              disabled={!selectedUser || selectedUser.id === 1}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid ' + (selectedUser && selectedUser.id !== 1 ? '#ea4335' : 'var(--panel-border)'),
                background: selectedUser && selectedUser.id !== 1 ? '#fce8e6' : '#f1f3f4',
                color: selectedUser && selectedUser.id !== 1 ? '#c5221f' : '#9aa0a6',
                cursor: selectedUser && selectedUser.id !== 1 ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)'
              }}
              title={selectedUser ? (selectedUser.id === 1 ? 'El Superadmin no se puede eliminar' : `Inactivar ${selectedUser.name}`) : 'Seleccione un usuario para inactivar'}
            >
              <span>🗑️</span> Inactivar
            </button>
          </div>
        </div>

        {/* BARRA INFORMATIVA DE SELECCIÓN */}
        {selectedUser && (
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
              <span className="code-col" style={{ fontWeight: 700 }}>#{selectedUser.id}</span>
              <strong style={{ color: 'var(--text-main)' }}>{selectedUser.name}</strong>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>Doc: <strong>{selectedUser.doc || 'N/A'}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>Email: <strong>{selectedUser.email}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                ...UserModel.getRoleBadgeStyle(selectedUser.role)
              }}>
                {UserModel.getRoleBadgeStyle(selectedUser.role).label}
              </span>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: '6px', 
                fontSize: '0.72rem', 
                fontWeight: 800,
                ...UserModel.getStatusBadgeStyle(selectedUser.status)
              }}>
                {UserModel.getStatusBadgeStyle(selectedUser.status).label}
              </span>
            </div>
            <button 
              onClick={() => setSelectedUser(null)} 
              style={{ background: 'none', border: 'none', color: 'var(--google-blue)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
            >
              ✕ Deseleccionar
            </button>
          </div>
        )}

        {/* BUSCADOR */}
        <div className="search-bar-container" style={{ marginBottom: '16px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
            <span style={{ position: 'absolute', left: '14px', color: 'var(--text-dim)', fontSize: '1rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre, documento, correo, teléfono o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pos-input"
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '36px',
                height: '42px',
                borderRadius: '12px',
                border: '1px solid var(--panel-border)',
                fontSize: '0.88rem'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            )}
          </div>
          {searchTerm && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '4px' }}>
              Encontrados: <strong>{totalItems}</strong> usuario(s)
            </div>
          )}
        </div>

        {/* TABLA PRINCIPAL DE USUARIOS */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--panel-border)', borderRadius: '14px' }}>
          <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ width: '50px', textAlign: 'center' }}>ID</th>
                <th style={{ width: '110px' }}>Documento</th>
                <th>Nombre y Apellido</th>
                <th>Correo (Login)</th>
                <th>Teléfono</th>
                <th style={{ width: '150px' }}>Rol RBAC</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Estado</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Creado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.4rem' }}>⏳</span>
                      <span>Cargando directorio de usuarios desde pos_rbac...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#c5221f' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                      <span>{error}</span>
                      <button onClick={fetchUsers} className="btn-secondary" style={{ marginTop: '8px', fontSize: '0.8rem' }}>
                        Reintentar
                      </button>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No se encontraron usuarios {searchTerm ? `con el término "${searchTerm}"` : 'registrados'}.
                  </td>
                </tr>
              ) : (
                paginated.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  const roleStyle = UserModel.getRoleBadgeStyle(u.role);
                  const statusStyle = UserModel.getStatusBadgeStyle(u.status);

                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUser(isSelected ? null : u)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? '#e8f0fe' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ textAlign: 'center' }} className="code-col">
                        #{u.id}
                      </td>
                      <td className="code-col" style={{ fontWeight: 600 }}>
                        {u.doc || '—'}
                      </td>
                      <td>
                        <strong>{u.name}</strong>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {u.email}
                      </td>
                      <td>
                        {u.phone || '—'}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 9px',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          ...roleStyle
                        }}>
                          {roleStyle.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          display: 'inline-block',
                          ...statusStyle
                        }}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        {u.createdAt || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
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
            {/* INFORMACIÓN DE REGISTROS */}
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Mostrando <strong style={{ color: 'var(--text-main)' }}>{startIndex + 1}</strong> a{' '}
              <strong style={{ color: 'var(--text-main)' }}>{Math.min(startIndex + itemsPerPage, totalItems)}</strong> de{' '}
              <strong style={{ color: 'var(--google-blue)' }}>{totalItems}</strong> usuarios
            </div>

            {/* SELECTOR DE FILAS POR PÁGINA Y CONTROLES */}
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

              {/* BOTONES DE PAGINACIÓN */}
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

      {/* MODAL CREAR USUARIO */}
      <UserCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
      />

      {/* MODAL MODIFICAR USUARIO */}
      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
        onSave={handleSaveEditedUser}
      />
    </div>
  );
}
