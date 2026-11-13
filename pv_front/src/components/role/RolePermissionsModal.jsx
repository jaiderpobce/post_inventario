import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { RoleModel } from '../../models/RoleModel';
import SubmoduleIcon from '../common/SubmoduleIcon';
import apiClient from '../../services/apiClient';

export default function RolePermissionsModal({ isOpen, onClose, role, onPermissionsUpdated }) {
  const { showSuccess, showError } = useNotification();

  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    if (isOpen && role) {
      setError('');
      setLoading(true);

      const fetchMatrix = async () => {
        const result = await apiClient.get(`/api/roles/${role.id}/matrix`);
        setLoading(false);
        if (result.ok && result.data) {
          setMatrix(result.data);
          // Por defecto expandir todos los módulos
          const expanded = {};
          (result.data.modules || []).forEach(m => {
            expanded[m.moduleId] = true;
          });
          setExpandedModules(expanded);
        } else {
          setError(result.message || 'No se pudo cargar la matriz de permisos del rol');
        }
      };

      fetchMatrix();
    }
  }, [isOpen, role]);

  if (!isOpen || !role) return null;

  const isSuperadmin = role.id === 1 || role.name === 'SUPERADMIN';

  const toggleModuleAccordion = (modId) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const handleToggleModule = (modId) => {
    if (isSuperadmin) return;

    setMatrix(prev => {
      if (!prev) return prev;
      const updatedMods = prev.modules.map(m => {
        if (m.moduleId !== modId) return m;
        const newEnabled = !m.enabled;
        // Al habilitar/deshabilitar el módulo, actualizamos en cascada las vistas
        const updatedViews = m.views.map(v => ({
          ...v,
          enabled: newEnabled,
          permissions: (v.permissions || []).map(p => ({
            ...p,
            allowed: newEnabled
          }))
        }));

        return {
          ...m,
          enabled: newEnabled,
          views: updatedViews
        };
      });

      return { ...prev, modules: updatedMods };
    });
  };

  const handleToggleView = (modId, viewId) => {
    if (isSuperadmin) return;

    setMatrix(prev => {
      if (!prev) return prev;
      const updatedMods = prev.modules.map(m => {
        if (m.moduleId !== modId) return m;
        const updatedViews = m.views.map(v => {
          if (v.viewId !== viewId) return v;
          const newEnabled = !v.enabled;
          return {
            ...v,
            enabled: newEnabled,
            permissions: (v.permissions || []).map(p => ({
              ...p,
              allowed: newEnabled
            }))
          };
        });

        // Si se activa una vista, nos aseguramos de que el módulo padre esté habilitado
        const anyViewActive = updatedViews.some(v => v.enabled);

        return {
          ...m,
          enabled: anyViewActive ? true : m.enabled,
          views: updatedViews
        };
      });

      return { ...prev, modules: updatedMods };
    });
  };

  const handleTogglePermission = (modId, viewId, permId) => {
    if (isSuperadmin) return;

    setMatrix(prev => {
      if (!prev) return prev;
      const updatedMods = prev.modules.map(m => {
        if (m.moduleId !== modId) return m;
        const updatedViews = m.views.map(v => {
          if (v.viewId !== viewId) return v;
          const updatedPerms = (v.permissions || []).map(p => {
            if (p.permissionId !== permId) return p;
            return {
              ...p,
              allowed: !p.allowed
            };
          });

          return {
            ...v,
            permissions: updatedPerms
          };
        });

        return { ...m, views: updatedViews };
      });

      return { ...prev, modules: updatedMods };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSuperadmin) {
      onClose();
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      modules: (matrix?.modules || []).map(m => ({
        moduleId: m.moduleId,
        enabled: m.enabled,
        views: (m.views || []).map(v => ({
          viewId: v.viewId,
          enabled: v.enabled,
          permissions: (v.permissions || []).map(p => ({
            permissionId: p.permissionId,
            allowed: p.allowed
          }))
        }))
      }))
    };

    const result = await apiClient.put(`/api/roles/${role.id}/matrix`, payload);
    setSaving(false);

    if (result.ok) {
      showSuccess(result.message || `Matriz de permisos para "${role.name}" guardada con éxito`);
      if (onPermissionsUpdated) {
        onPermissionsUpdated(role);
      }
      onClose();
    } else {
      showError(result.message, 'Fallo al guardar matriz de permisos');
      setError(result.message);
    }
  };

  const badgeStyle = RoleModel.getRoleBadgeStyle(role.name);

  return (
    <div className="modal-overlay active" style={{ zIndex: 1100 }}>
      <div 
        className="modal-box" 
        style={{ 
          width: '820px', 
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#8430ce', margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔐</span> Matriz de Módulos, Vistas y Permisos RBAC
              </h3>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                ...badgeStyle
              }}>
                {badgeStyle.label}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
              Configure la activación de módulos principales, sus submódulos y autorizaciones granulares por pantalla.
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
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {isSuperadmin && (
          <div style={{
            background: '#e8f0fe',
            color: 'var(--google-blue)',
            border: '1px solid #c2e7ff',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>👑</span>
            <span>El rol <strong>SUPERADMIN</strong> posee acceso irrestricto y permanente a todos los módulos y funciones del sistema (Bypass de autorizaciones).</span>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL: ÁRBOL JERÁRQUICO */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', paddingRight: '4px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '1.6rem' }}>⏳</span>
              <div style={{ marginTop: '8px', fontSize: '0.88rem' }}>Cargando matriz RBAC desde la base de datos...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(matrix?.modules || []).map(mod => {
                const isExpanded = !!expandedModules[mod.moduleId];
                const activeViewsCount = (mod.views || []).filter(v => v.enabled).length;

                return (
                  <div
                    key={mod.moduleId}
                    style={{
                      border: '1px solid ' + (mod.enabled ? '#c2e7ff' : 'var(--panel-border)'),
                      borderRadius: '16px',
                      overflow: 'hidden',
                      background: '#ffffff',
                      boxShadow: mod.enabled ? '0 2px 8px rgba(26,115,232,0.06)' : 'none',
                      transition: 'var(--transition)'
                    }}
                  >
                    {/* BARRA DE TÍTULO DEL MÓDULO */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 18px',
                      background: mod.enabled ? '#f0f6ff' : '#f8f9fa',
                      borderBottom: isExpanded ? '1px solid var(--panel-border)' : 'none'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* CHECKBOX DE ACTIVACIÓN DEL MÓDULO */}
                        <input
                          type="checkbox"
                          checked={mod.enabled}
                          disabled={isSuperadmin}
                          onChange={() => handleToggleModule(mod.moduleId)}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: isSuperadmin ? 'not-allowed' : 'pointer',
                            accentColor: 'var(--google-blue)'
                          }}
                        />

                        <span style={{ display: 'flex', alignItems: 'center', color: mod.enabled ? 'var(--google-blue)' : 'var(--text-dim)' }}>
                          <SubmoduleIcon name={mod.icon || 'dashboard'} size={20} />
                        </span>

                        <div>
                          <strong style={{ fontSize: '0.94rem', color: mod.enabled ? 'var(--text-main)' : 'var(--text-muted)' }}>
                            {mod.moduleName}
                          </strong>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                            {mod.description}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: mod.enabled ? '#e6f4ea' : '#f1f3f4',
                          color: mod.enabled ? '#137333' : '#70757a'
                        }}>
                          {mod.enabled ? `${activeViewsCount}/${mod.views?.length || 0} Vistas Activas` : 'Deshabilitado'}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleModuleAccordion(mod.moduleId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--google-blue)',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            padding: '4px 8px'
                          }}
                        >
                          {isExpanded ? '▲ Ocultar' : '▼ Expandir'}
                        </button>
                      </div>
                    </div>

                    {/* SUBMÓDULOS Y VISTAS HIJAS */}
                    {isExpanded && (
                      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#fafbfc' }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Vistas y Pantallas Autorizadas:
                        </div>

                        {(mod.views || []).map(v => (
                          <div
                            key={v.viewId}
                            style={{
                              border: '1px solid ' + (v.enabled ? '#dadce0' : '#f1f3f4'),
                              borderRadius: '12px',
                              padding: '10px 14px',
                              background: v.enabled ? '#ffffff' : '#f8f9fa',
                              opacity: mod.enabled ? 1 : 0.6
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: isSuperadmin || !mod.enabled ? 'default' : 'pointer', margin: 0, flex: 1 }}>
                                <input
                                  type="checkbox"
                                  checked={v.enabled}
                                  disabled={isSuperadmin || !mod.enabled}
                                  onChange={() => handleToggleView(mod.moduleId, v.viewId)}
                                  style={{
                                    width: '16px',
                                    height: '16px',
                                    cursor: isSuperadmin || !mod.enabled ? 'not-allowed' : 'pointer',
                                    accentColor: '#137333'
                                  }}
                                />
                                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--google-blue)' }}>
                                  <SubmoduleIcon name={v.icon || 'dashboard'} size={18} />
                                </span>
                                <div>
                                  <strong style={{ fontSize: '0.86rem', color: v.enabled ? 'var(--text-main)' : 'var(--text-dim)' }}>
                                    {v.viewName}
                                  </strong>
                                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                    <code>{v.route}</code>
                                  </span>
                                </div>
                              </label>

                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: v.enabled ? '#e8f0fe' : '#f1f3f4',
                                color: v.enabled ? 'var(--google-blue)' : '#9aa0a6'
                              }}>
                                {v.enabled ? 'Acceso Concedido' : 'Restringido'}
                              </span>
                            </div>

                            {/* PERMISOS GRANULARES DE PANTALLA (SI APLICA, EJ. TERMINAL POS) */}
                            {v.permissions && v.permissions.length > 0 && (
                              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--panel-border)', paddingLeft: '26px' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px' }}>
                                  Acciones y Permisos Operativos:
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                                  {v.permissions.map(p => (
                                    <label
                                      key={p.permissionId}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.78rem',
                                        color: p.allowed && v.enabled ? 'var(--text-main)' : 'var(--text-dim)',
                                        cursor: isSuperadmin || !v.enabled ? 'default' : 'pointer',
                                        margin: 0
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={p.allowed}
                                        disabled={isSuperadmin || !v.enabled}
                                        onChange={() => handleTogglePermission(mod.moduleId, v.viewId, p.permissionId)}
                                        style={{
                                          width: '14px',
                                          height: '14px',
                                          accentColor: '#8430ce',
                                          cursor: isSuperadmin || !v.enabled ? 'not-allowed' : 'pointer'
                                        }}
                                      />
                                      <span>{p.name} ({p.description})</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
              Cerrar
            </button>
            {!isSuperadmin && (
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
                {saving ? 'Guardando Matriz...' : '✓ Guardar Matriz de Permisos'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
