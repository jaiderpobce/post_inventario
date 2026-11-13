import React, { useState, useEffect } from 'react';
import { RoleModel } from '../models/RoleModel';
import { useNotification } from '../context/NotificationContext';
import RoleCreateModal from '../components/role/RoleCreateModal';
import RoleEditModal from '../components/role/RoleEditModal';
import RolePermissionsModal from '../components/role/RolePermissionsModal';
import apiClient from '../services/apiClient';

export default function RolesView() {
  const { showSuccess, showError } = useNotification();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    const result = await apiClient.get('/api/roles');
    setLoading(false);
    if (result.ok) {
      setRoles(Array.isArray(result.data) ? result.data : []);
      setError('');
    } else {
      setError(result.message);
      showError(result.message, 'Catálogo de Roles');
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRole(null);
  }, [searchTerm]);

  const filtered = RoleModel.filterRoles(roles, searchTerm);
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    if (selectedRole.id === 1 || selectedRole.name === 'SUPERADMIN') {
      showError('No se permite eliminar el rol SUPERADMIN del sistema', 'Seguridad RBAC');
      return;
    }

    const confirmed = window.confirm(`¿Seguro que desea eliminar el rol "${selectedRole.name}"?`);
    if (!confirmed) return;

    const result = await apiClient.delete(`/api/roles/${selectedRole.id}`);
    if (result.ok) {
      setRoles(prev => prev.filter(r => r.id !== selectedRole.id));
      setSelectedRole(null);
      showSuccess(result.message || `Rol "${selectedRole.name}" eliminado`);
    } else {
      showError(result.message, 'Fallo al eliminar rol');
    }
  };

  const handleRoleCreated = (newRole) => {
    setRoles(prev => [...prev, newRole]);
    setSelectedRole(newRole);
    setCurrentPage(1);
  };

  const handleRoleUpdated = (updated) => {
    setRoles(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
    setSelectedRole(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
  };

  const handlePermissionsUpdated = () => {
    fetchRoles(); // Recarga contadores de módulos y permisos
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', flex: 1, width: '100%' }}>
      <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '20px', padding: '28px', boxShadow: 'var(--shadow-main)' }}>
        
        {/* ENCABEZADO Y BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.4rem' }}>
              🛡️ Matriz de Roles y Autorizaciones (RBAC)
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.88rem' }}>
              Estructura jerárquica de perfiles, activación de módulos, submódulos y permisos granulares en <strong>pos_rbac.rol</strong>.
            </p>
          </div>

          {/* BOTONERA DE ACCIONES UNIFORME */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn-quick-add" 
              onClick={() => setIsCreateModalOpen(true)}
            >
              ＋ Nuevo Rol
            </button>

            {/* BOTÓN MODIFICAR */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              disabled={!selectedRole}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid ' + (selectedRole ? 'var(--google-blue)' : 'var(--panel-border)'),
                background: selectedRole ? '#e8f0fe' : '#f1f3f4',
                color: selectedRole ? 'var(--google-blue)' : '#9aa0a6',
                cursor: selectedRole ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)'
              }}
              title={selectedRole ? `Modificar ${selectedRole.name}` : 'Seleccione un rol para modificar'}
            >
              <span>✏️</span> Modificar
            </button>

            {/* BOTÓN PERMISOS Y MÓDULOS */}
            <button
              onClick={() => setIsPermissionsModalOpen(true)}
              disabled={!selectedRole}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid ' + (selectedRole ? '#8430ce' : 'var(--panel-border)'),
                background: selectedRole ? '#f3e8fd' : '#f1f3f4',
                color: selectedRole ? '#8430ce' : '#9aa0a6',
                cursor: selectedRole ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)'
              }}
              title={selectedRole ? `Configurar módulos, vistas y permisos de ${selectedRole.name}` : 'Seleccione un rol para configurar permisos'}
            >
              <span>🔐</span> Permisos / Módulos
            </button>

            {/* BOTÓN ELIMINAR */}
            <button
              onClick={handleDeleteRole}
              disabled={!selectedRole || selectedRole.id === 1}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid ' + (selectedRole && selectedRole.id !== 1 ? '#ea4335' : 'var(--panel-border)'),
                background: selectedRole && selectedRole.id !== 1 ? '#fce8e6' : '#f1f3f4',
                color: selectedRole && selectedRole.id !== 1 ? '#c5221f' : '#9aa0a6',
                cursor: selectedRole && selectedRole.id !== 1 ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)'
              }}
              title={selectedRole ? (selectedRole.id === 1 ? 'El Superadmin no se puede eliminar' : `Eliminar rol ${selectedRole.name}`) : 'Seleccione un rol para eliminar'}
            >
              <span>🗑️</span> Eliminar
            </button>
          </div>
        </div>

        {/* BARRA INFORMATIVA DE SELECCIÓN */}
        {selectedRole && (
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
              <span className="code-col" style={{ fontWeight: 700 }}>#{selectedRole.id}</span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: 800,
                ...RoleModel.getRoleBadgeStyle(selectedRole.name)
              }}>
                {RoleModel.getRoleBadgeStyle(selectedRole.name).label}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>{selectedRole.description || 'Sin descripción'}</span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>Usuarios: <strong style={{ color: 'var(--google-blue)' }}>{selectedRole.usersCount || 0}</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>Módulos: <strong style={{ color: '#137333' }}>{selectedRole.modulesCount || 0}/4</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <span>Permisos Granulares: <strong style={{ color: '#8430ce' }}>{selectedRole.permissionsCount || 0}</strong></span>
            </div>
            <button 
              onClick={() => setSelectedRole(null)} 
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
              placeholder="Buscar rol por nombre o descripción..."
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
              Encontrados: <strong>{totalItems}</strong> rol(es)
            </div>
          )}
        </div>

        {/* TABLA PRINCIPAL DE ROLES */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--panel-border)', borderRadius: '14px' }}>
          <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ width: '50px', textAlign: 'center' }}>ID</th>
                <th style={{ width: '180px' }}>Rol RBAC</th>
                <th>Descripción y Funciones</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Operadores</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Módulos Activos</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Permisos Vistas</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.4rem' }}>⏳</span>
                      <span>Cargando matriz de roles desde pos_rbac...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#c5221f' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                      <span>{error}</span>
                      <button onClick={fetchRoles} className="btn-secondary" style={{ marginTop: '8px', fontSize: '0.8rem' }}>
                        Reintentar
                      </button>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No se encontraron roles {searchTerm ? `con el término "${searchTerm}"` : 'registrados'}.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => {
                  const isSelected = selectedRole?.id === r.id;
                  const roleStyle = RoleModel.getRoleBadgeStyle(r.name);

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRole(isSelected ? null : r)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? '#e8f0fe' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ textAlign: 'center' }} className="code-col">
                        #{r.id}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          ...roleStyle
                        }}>
                          {roleStyle.label}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-main)', fontSize: '0.86rem' }}>
                        {r.description || '—'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--google-blue)' }}>
                        {r.usersCount || 0}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: r.modulesCount > 0 ? '#e6f4ea' : '#f1f3f4',
                          color: r.modulesCount > 0 ? '#137333' : '#70757a'
                        }}>
                          {r.modulesCount || 0} / 4 Módulos
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#8430ce' }}>
                        {r.permissionsCount || 0}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: '#e6f4ea',
                          color: '#137333'
                        }}>
                          ● Activo
                        </span>
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
              <strong style={{ color: 'var(--google-blue)' }}>{totalItems}</strong> roles
            </div>

            {/* CONTROLES DE PÁGINA */}
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

      {/* MODAL CREAR ROL */}
      <RoleCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoleCreated={handleRoleCreated}
      />

      {/* MODAL MODIFICAR ROL */}
      <RoleEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        role={selectedRole}
        onSave={handleRoleUpdated}
      />

      {/* MODAL MATRIZ DE PERMISOS */}
      <RolePermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        role={selectedRole}
        onPermissionsUpdated={handlePermissionsUpdated}
      />
    </div>
  );
}
