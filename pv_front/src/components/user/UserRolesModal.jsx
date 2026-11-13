import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { UserModel } from '../../models/UserModel';
import apiClient from '../../services/apiClient';

export default function UserRolesModal({ isOpen, onClose, user, onRolesUpdated }) {
  const { showSuccess, showError } = useNotification();

  const [roles, setRoles] = useState([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setError('');
      setLoading(true);

      const fetchRoles = async () => {
        const result = await apiClient.get(`/api/users/${user.id}/roles`);
        setLoading(false);
        if (result.ok && Array.isArray(result.data)) {
          setRoles(result.data);
          const assignedIds = result.data.filter(r => r.assigned).map(r => r.id);
          setSelectedRoleIds(assignedIds);
        } else {
          setError(result.message || 'No se pudieron cargar los roles del usuario');
        }
      };

      fetchRoles();
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleToggleRole = (roleId) => {
    if (user.id === 1 && roleId === 1) {
      // Superadmin principal no puede removerse a sí mismo el rol SUPERADMIN
      return;
    }

    setSelectedRoleIds(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (selectedRoleIds.length === 0) {
      setError('Debe seleccionar al menos un rol para el usuario');
      return;
    }

    setSaving(true);
    setError('');

    const result = await apiClient.put(`/api/users/${user.id}/roles`, { roleIds: selectedRoleIds });
    setSaving(false);

    if (result.ok) {
      const updatedUser = {
        ...user,
        role: result.data?.role || user.role,
        roles: result.data?.roles || [],
        roleIds: result.data?.roleIds || selectedRoleIds
      };

      showSuccess(result.message || `Roles actualizados exitosamente para "${user.name}"`);
      if (onRolesUpdated) {
        onRolesUpdated(updatedUser);
      }
      onClose();
    } else {
      showError(result.message, 'Fallo al actualizar roles');
      setError(result.message);
    }
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 1100 }}>
      <div 
        className="modal-box" 
        style={{ 
          width: '600px', 
          maxWidth: '96vw', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column',
          padding: '24px 28px',
          borderRadius: '24px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.18)'
        }}
      >
        {/* ENCABEZADO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '14px' }}>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#8430ce', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🛡️</span> Asignación de Roles RBAC
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
              Operador: <strong style={{ color: 'var(--text-main)' }}>{user.name}</strong> ({user.email})
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={saving}
            style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' }}
          >
            ✕
          </button>
        </div>

        {/* ALERTA DE ERROR */}
        {error && (
          <div style={{
            background: '#fce8e6',
            color: '#c5221f',
            border: '1px solid #fad2cf',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.84rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL: LISTA DE ROLES CON CHECKBOXES */}
        <form onSubmit={handleSave} style={{ overflowY: 'auto', paddingRight: '4px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Seleccione el o los roles que desea conceder a este usuario. Los permisos de acceso se gobernarán según la matriz RBAC:
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '1.4rem' }}>⏳</span>
              <div style={{ marginTop: '8px', fontSize: '0.86rem' }}>Cargando catálogo de roles desde pos_rbac...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {roles.map(r => {
                const isChecked = selectedRoleIds.includes(r.id);
                const badgeStyle = UserModel.getRoleBadgeStyle(r.nombre_rol || r.name);
                const isSuperadminLocked = user.id === 1 && r.id === 1;

                return (
                  <div
                    key={r.id}
                    onClick={() => handleToggleRole(r.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      border: '1px solid ' + (isChecked ? '#8430ce' : 'var(--panel-border)'),
                      background: isChecked ? '#f9f3ff' : '#ffffff',
                      cursor: isSuperadminLocked ? 'default' : 'pointer',
                      transition: 'var(--transition)',
                      boxShadow: isChecked ? '0 2px 8px rgba(132,48,206,0.08)' : 'none'
                    }}
                  >
                    {/* CHECKBOX CUSTOM */}
                    <div style={{ marginTop: '2px' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isSuperadminLocked}
                        onChange={() => {}} // controlado por el contenedor onClick
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: isSuperadminLocked ? 'not-allowed' : 'pointer',
                          accentColor: '#8430ce'
                        }}
                      />
                    </div>

                    {/* DETALLES DEL ROL */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '8px',
                          ...badgeStyle
                        }}>
                          {badgeStyle.label}
                        </span>

                        {isSuperadminLocked && (
                          <span style={{ fontSize: '0.72rem', color: '#b06000', fontWeight: 600 }}>
                            🔒 Rol Permanente (Superadmin principal)
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        {r.descripcion || r.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--panel-border)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: '1px solid var(--panel-border)',
                background: '#ffffff',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              style={{
                padding: '9px 22px',
                borderRadius: '10px',
                border: 'none',
                background: '#8430ce',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: saving || loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(132,48,206,0.25)'
              }}
            >
              {saving ? 'Guardando Roles...' : '✓ Guardar Asignación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
