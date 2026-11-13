import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';

export default function RoleCreateModal({ isOpen, onClose, onRoleCreated }) {
  const { showSuccess, showError } = useNotification();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('El identificador o nombre del rol es obligatorio');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      name: name.trim().toUpperCase().replace(/\s+/g, '_'),
      description: description.trim()
    };

    const result = await apiClient.post('/api/roles', payload);
    setSaving(false);

    if (result.ok) {
      const created = result.data?.role || {
        id: Date.now(),
        ...payload,
        usersCount: 0,
        modulesCount: 0,
        permissionsCount: 0,
        status: 'ACTIVO'
      };

      showSuccess(result.message || `Rol "${created.name}" registrado exitosamente`);
      if (onRoleCreated) {
        onRoleCreated(created);
      }
      onClose();
    } else {
      showError(result.message, 'Fallo al registrar rol');
      setError(result.message);
    }
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 1100 }}>
      <div 
        className="modal-box" 
        style={{ 
          width: '560px', 
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
            <h3 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🛡️</span> Nuevo Rol del Sistema
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
              Definir un nuevo perfil de autorización en la matriz <strong>pos_rbac.rol</strong>
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

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Nombre del Rol (Código RBAC) <span style={{ color: '#ea4335' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. ALMACENISTA, AUDITOR, GERENTE"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid var(--panel-border)',
                fontSize: '0.86rem',
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Se guardará en mayúsculas sin espacios (ej. <code>SUPERVISOR_TIENDA</code>).
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Descripción y Alcance de Funciones
            </label>
            <textarea
              rows="3"
              placeholder="Describa el alcance de funciones, autorizaciones de caja o áreas asignadas a este rol..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid var(--panel-border)',
                fontSize: '0.86rem',
                resize: 'none'
              }}
            />
          </div>

          <div style={{
            background: '#f3e8fd',
            color: '#8430ce',
            border: '1px solid #d2a4f9',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '2px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>🔐</span>
            <div>
              <strong>Configuración de Permisos:</strong> Una vez creado el rol, podrás habilitarle módulos, pantallas y permisos granulares usando el botón <strong>«🔐 Permisos / Módulos»</strong>.
            </div>
          </div>

          {/* BOTONES */}
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
              disabled={saving}
              style={{
                padding: '9px 22px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--google-blue)',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(26,115,232,0.25)'
              }}
            >
              {saving ? 'Guardando...' : '✓ Guardar Rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
