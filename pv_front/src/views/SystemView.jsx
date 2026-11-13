import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { UserModel } from '../models/UserModel';
import UserCreateModal from '../components/user/UserCreateModal';
import UserEditModal from '../components/user/UserEditModal';
import UserRolesModal from '../components/user/UserRolesModal';
import SubmoduleIcon from '../components/common/SubmoduleIcon';
import apiClient from '../services/apiClient';

export default function SystemView() {
  const { user, getSubmodules } = useAuth();
  const { showSuccess, showError } = useNotification();
  const dbSubmodules = getSubmodules('/sistema');

  // Submódulos dinámicos leídos de pos_rbac.vistas (con fallback)
  const systemSubmodules = dbSubmodules.length > 0
    ? dbSubmodules.map(s => ({
        id: s.ruta.split('/').pop().replace('-logs', ''), // normaliza 'usuarios', 'roles', 'auditoria'
        label: s.nombre,
        icono: s.icono,
        desc: s.descripcion
      }))
    : [
        { id: 'usuarios', label: 'Usuarios y Cuentas', icono: 'manage_accounts', desc: 'Gestión de operadores y cajeros' },
        { id: 'roles', label: 'Roles y Permisos (RBAC)', icono: 'security', desc: 'Configuración de matriz RBAC' },
        { id: 'cajas', label: 'Terminales y Cajas', icono: 'point_of_sale', desc: 'Puntos de venta físicos y turnos' },
        { id: 'hardware', label: 'Impresoras y Dispositivos', icono: 'print', desc: 'Ticketeras fiscales y balanzas' },
        { id: 'auditoria', label: 'Logs de Auditoría', icono: 'history', desc: 'Historial de acciones y seguridad' },
        { id: 'general', label: 'Parámetros del Sistema', icono: 'tune', desc: 'Moneda, IVA y datos de empresa' }
      ];

  const [activeTab, setActiveTab] = useState('usuarios');

  // Estado para gestión de Usuarios y Cuentas (Uniforme con Clientes)
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userItemsPerPage, setUserItemsPerPage] = useState(10);
  const [isUserCreateModalOpen, setIsUserCreateModalOpen] = useState(false);
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [isUserRolesModalOpen, setIsUserRolesModalOpen] = useState(false);

  const fetchUsers = async () => {
    setUsersLoading(true);
    const result = await apiClient.get('/api/users');
    setUsersLoading(false);
    if (result.ok) {
      setUsers(Array.isArray(result.data) ? result.data : []);
    } else {
      showError(result.message, 'Gestión de Usuarios');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setUserCurrentPage(1);
    setSelectedUser(null);
  }, [userSearch]);

  const filteredUsers = UserModel.filterUsers(users, userSearch);
  const totalUserItems = filteredUsers.length;
  const totalUserPages = Math.max(1, Math.ceil(totalUserItems / userItemsPerPage));
  const userStartIndex = (userCurrentPage - 1) * userItemsPerPage;
  const paginatedUsers = filteredUsers.slice(userStartIndex, userStartIndex + userItemsPerPage);

  const handleToggleSuspendUser = async () => {
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

    const confirmed = window.confirm(`¿Seguro que desea inactivar / suspender al usuario "${selectedUser.name}"?`);
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

  const handleRolesUpdated = (updated) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
    setSelectedUser(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
  };

  const handleUserCreated = (newUser) => {
    setUsers(prev => [newUser, ...prev]);
    setSelectedUser(newUser);
    setUserCurrentPage(1);
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
          SIDEBAR LATERAL TIPO DASHBOARD (SUBMÓDULOS DE SISTEMA)
         ======================================================== */}
      <aside style={{
        width: '300px',
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
            <span style={{ fontSize: '1.4rem' }}>⚙️</span>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.2rem' }}>
              Módulo Sistema
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Panel de control administrativo y RBAC
          </p>
        </div>

        {/* LISTA DE SUBMÓDULOS */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {systemSubmodules.map((sub) => {
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

        {/* PIE DEL SIDEBAR (ESTADO RBAC) */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--panel-border)', paddingLeft: '8px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Base de Datos Conectada:</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#137333', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#137333', display: 'inline-block' }}></span>
            pos_rbac (MariaDB 10.11)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            Operando como: <strong>{user?.rol || 'SUPERADMIN'}</strong>
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

        {/* 1. SUBMÓDULO: USUARIOS Y CUENTAS (UNIFORME CON CLIENTES) */}
        {activeTab === 'usuarios' && (
          <div>
            {/* ENCABEZADO Y BOTONES DE ACCIÓN */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.4rem' }}>
                  👥 Gestión de Usuarios y Cuentas (RBAC)
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Control de operadores, credenciales y permisos administrados en <strong>pos_rbac</strong>.
                </p>
              </div>

              {/* BOTONERA DE ACCIONES UNIFORME */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn-quick-add" 
                  onClick={() => setIsUserCreateModalOpen(true)}
                  title="Registrar un nuevo operador en el sistema"
                >
                  ＋ Nuevo Usuario
                </button>

                {/* BOTÓN MODIFICAR */}
                <button
                  onClick={() => setIsUserEditModalOpen(true)}
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

                {/* BOTÓN ROLES */}
                <button
                  onClick={() => setIsUserRolesModalOpen(true)}
                  disabled={!selectedUser}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: '1px solid ' + (selectedUser ? '#8430ce' : 'var(--panel-border)'),
                    background: selectedUser ? '#f3e8fd' : '#f1f3f4',
                    color: selectedUser ? '#8430ce' : '#9aa0a6',
                    cursor: selectedUser ? 'pointer' : 'not-allowed',
                    transition: 'var(--transition)'
                  }}
                  title={selectedUser ? `Asignar o modificar roles de ${selectedUser.name}` : 'Seleccione un usuario para gestionar sus roles'}
                >
                  <span>🛡️</span> Roles
                </button>

                {/* BOTÓN SUSPENDER / REACTIVAR */}
                <button
                  onClick={handleToggleSuspendUser}
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
                  title={selectedUser ? (selectedUser.id === 1 ? 'El Superadmin principal no se puede suspender' : (selectedUser.status === 'SUSPENDIDO' ? 'Reactivar usuario' : 'Suspender acceso')) : 'Seleccione un usuario para suspender o reactivar'}
                >
                  <span>{selectedUser?.status === 'SUSPENDIDO' ? '▶️' : '⏸️'}</span> 
                  {selectedUser?.status === 'SUSPENDIDO' ? 'Reactivar' : 'Suspender'}
                </button>

                {/* BOTÓN INACTIVAR */}
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
                  title={selectedUser ? (selectedUser.id === 1 ? 'El Superadmin no se puede eliminar' : `Inactivar a ${selectedUser.name}`) : 'Seleccione un usuario para inactivar'}
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
                  placeholder="Buscar usuario por nombre, documento, correo, teléfono o rol..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
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
                {userSearch && (
                  <button
                    onClick={() => setUserSearch('')}
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
              {userSearch && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '4px' }}>
                  Encontrados: <strong>{totalUserItems}</strong> usuario(s)
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
                    <th style={{ width: '140px', textAlign: 'center' }}>Fecha Alta</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.4rem' }}>⏳</span>
                          <span>Cargando operadores desde pos_rbac...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No se encontraron usuarios {userSearch ? `con el término "${userSearch}"` : 'registrados'}.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => {
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
            {!usersLoading && totalUserItems > 0 && (
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
                  Mostrando <strong style={{ color: 'var(--text-main)' }}>{userStartIndex + 1}</strong> a{' '}
                  <strong style={{ color: 'var(--text-main)' }}>{Math.min(userStartIndex + userItemsPerPage, totalUserItems)}</strong> de{' '}
                  <strong style={{ color: 'var(--google-blue)' }}>{totalUserItems}</strong> usuarios
                </div>

                {/* SELECTOR DE FILAS POR PÁGINA Y CONTROLES */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span>Filas por página:</span>
                    <select
                      value={userItemsPerPage}
                      onChange={(e) => {
                        setUserItemsPerPage(Number(e.target.value));
                        setUserCurrentPage(1);
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
                      onClick={() => setUserCurrentPage(1)}
                      disabled={userCurrentPage === 1}
                      style={{
                        padding: '5px 9px',
                        borderRadius: '8px',
                        border: '1px solid var(--panel-border)',
                        background: '#ffffff',
                        cursor: userCurrentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: userCurrentPage === 1 ? 0.4 : 1,
                        fontSize: '0.8rem'
                      }}
                      title="Primera página"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setUserCurrentPage(p => Math.max(1, p - 1))}
                      disabled={userCurrentPage === 1}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--panel-border)',
                        background: '#ffffff',
                        cursor: userCurrentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: userCurrentPage === 1 ? 0.4 : 1,
                        fontSize: '0.8rem'
                      }}
                      title="Página anterior"
                    >
                      ‹ Anterior
                    </button>

                    <span style={{ fontSize: '0.84rem', fontWeight: 700, padding: '0 8px', color: 'var(--google-blue)' }}>
                      Página {userCurrentPage} de {totalUserPages}
                    </span>

                    <button
                      onClick={() => setUserCurrentPage(p => Math.min(totalUserPages, p + 1))}
                      disabled={userCurrentPage === totalUserPages}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--panel-border)',
                        background: '#ffffff',
                        cursor: userCurrentPage === totalUserPages ? 'not-allowed' : 'pointer',
                        opacity: userCurrentPage === totalUserPages ? 0.4 : 1,
                        fontSize: '0.8rem'
                      }}
                      title="Página siguiente"
                    >
                      Siguiente ›
                    </button>
                    <button
                      onClick={() => setUserCurrentPage(totalUserPages)}
                      disabled={userCurrentPage === totalUserPages}
                      style={{
                        padding: '5px 9px',
                        borderRadius: '8px',
                        border: '1px solid var(--panel-border)',
                        background: '#ffffff',
                        cursor: userCurrentPage === totalUserPages ? 'not-allowed' : 'pointer',
                        opacity: userCurrentPage === totalUserPages ? 0.4 : 1,
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

        {/* 2. SUBMÓDULO: ROLES Y PERMISOS RBAC */}
        {activeTab === 'roles' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: 0, fontSize: '1.4rem' }}>
                  🛡️ Matriz de Roles y Autorizaciones (RBAC)
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Estructura jerárquica de roles y permisos granulares gobernados por la tabla <strong>pos_rbac.rol</strong>.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ color: 'var(--google-blue)', margin: 0, fontSize: '1.05rem' }}>👑 SUPERADMIN</h4>
                  <span style={{ background: '#e8f0fe', color: 'var(--google-blue)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>ACCESO TOTAL</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Acceso irrestricto a todas las pantallas, bypass de autorizaciones y control total del sistema.
                </p>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#137333' }}>
                  ✓ 32/32 Permisos concedidos
                </div>
              </div>

              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ color: '#b06000', margin: 0, fontSize: '1.05rem' }}>💼 ADMINISTRADOR</h4>
                  <span style={{ background: '#fef7e0', color: '#b06000', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>OPERACIONAL</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Gestión completa del catálogo de productos, compras, reportes de cierre e inventario.
                </p>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#137333' }}>
                  ✓ Acceso a 4 Módulos
                </div>
              </div>

              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ color: '#9334e6', margin: 0, fontSize: '1.05rem' }}>🔍 SUPERVISOR</h4>
                  <span style={{ background: '#f3e8fd', color: '#9334e6', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>AUTORIZACIONES</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Autorización de anulaciones de venta en caja (F3), descuentos especiales y arqueos de caja.
                </p>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--google-blue)' }}>
                  ✓ Permisos especiales de caja
                </div>
              </div>

              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ color: 'var(--google-green)', margin: 0, fontSize: '1.05rem' }}>🛒 CAJERO</h4>
                  <span style={{ background: '#e6f4ea', color: 'var(--google-green)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>PUNTO DE VENTA</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Limitado exclusivamente al terminal de facturación y cobro. Sin acceso a reportes ni configuración.
                </p>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--google-green)' }}>
                  ✓ Acceso único al Módulo POS
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. SUBMÓDULO: TERMINALES Y CAJAS */}
        {activeTab === 'cajas' && (
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: '0 0 6px 0', fontSize: '1.4rem' }}>
              🖥️ Configuración de Terminal y Caja
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
              Parámetros de la estación física de trabajo y caja registradora.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Número de Terminal</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--google-blue)', fontFamily: 'Orbitron, monospace' }}>POS-01</div>
              </div>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estado de Caja</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--google-green)' }}>ABIERTA</div>
              </div>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px', background: '#f8f9fa' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cajero en Turno</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>{user?.nombre}</div>
              </div>
            </div>
          </div>
        )}

        {/* 4. SUBMÓDULO: HARDWARE */}
        {activeTab === 'hardware' && (
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: '0 0 6px 0', fontSize: '1.4rem' }}>
              🖨️ Impresoras y Periféricos
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
              Conexión de impresoras fiscales de tickets, balanzas de peso y lectores de códigos de barra.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--google-blue)' }}>🖨️ Impresora de Tickets / Facturas</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Modelo: Epson TM-T20III (Térmica 80mm)</p>
                <div style={{ fontSize: '0.8rem', marginTop: '10px' }}>Puerto: <code>COM1 / /dev/ttyUSB0</code> (9600 baudios)</div>
              </div>

              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--google-green)' }}>⚖️ Balanza Electrónica de Mostrador</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Para productos pesables (carnes, quesos, verduras)</p>
                <div style={{ fontSize: '0.8rem', marginTop: '10px' }}>Protocolo: <code>Toledo / Dibal / CAS</code></div>
              </div>
            </div>
          </div>
        )}

        {/* 5. SUBMÓDULO: AUDITORÍA Y LOGS */}
        {activeTab === 'auditoria' && (
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: '0 0 6px 0', fontSize: '1.4rem' }}>
              📋 Registro de Auditoría y Trazabilidad
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Registro de eventos de seguridad capturados en <strong>pos_rbac.auditoria_logs</strong>.
            </p>

            <table className="pos-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Fecha y Hora</th>
                  <th>Usuario</th>
                  <th>Acción Realizada</th>
                  <th>Tabla / Módulo</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>12/11/2026 15:20</td>
                  <td><strong>superadmin@sistema.com</strong></td>
                  <td>INICIALIZACION_SISTEMA</td>
                  <td>pos_rbac</td>
                  <td><span style={{ color: '#137333', fontWeight: 700 }}>EXITOSO</span></td>
                </tr>
                <tr>
                  <td>12/11/2026 15:30</td>
                  <td><strong>superadmin@sistema.com</strong></td>
                  <td>CONFIGURACION_MODULO</td>
                  <td>modulo / vistas</td>
                  <td><span style={{ color: '#137333', fontWeight: 700 }}>EXITOSO</span></td>
                </tr>
                <tr>
                  <td>12/11/2026 15:45</td>
                  <td><strong>cajero@sistema.com</strong></td>
                  <td>INICIO_TURNO_CAJA</td>
                  <td>caja / venta</td>
                  <td><span style={{ color: '#137333', fontWeight: 700 }}>EXITOSO</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 6. SUBMÓDULO: GENERAL */}
        {activeTab === 'general' && (
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: '0 0 6px 0', fontSize: '1.4rem' }}>
              ⚙️ Parámetros Generales de Facturación
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Moneda base, tasa de impuesto al valor agregado (IVA) y datos fiscales.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Tasa de IVA Predeterminada
                </label>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--google-blue)' }}>16.00%</div>
              </div>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Moneda Base del Sistema
                </label>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--google-green)' }}>Dólar Estadounidense ($ USD)</div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL CREAR USUARIO */}
      <UserCreateModal
        isOpen={isUserCreateModalOpen}
        onClose={() => setIsUserCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
      />

      {/* MODAL MODIFICAR USUARIO */}
      <UserEditModal
        isOpen={isUserEditModalOpen}
        onClose={() => setIsUserEditModalOpen(false)}
        user={selectedUser}
        onSave={handleSaveEditedUser}
      />

      {/* MODAL ASIGNAR ROLES RBAC */}
      <UserRolesModal
        isOpen={isUserRolesModalOpen}
        onClose={() => setIsUserRolesModalOpen(false)}
        user={selectedUser}
        onRolesUpdated={handleRolesUpdated}
      />
    </div>
  );
}
