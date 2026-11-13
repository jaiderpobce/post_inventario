import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';

export default function RoleEditModal({ isOpen, onClose, role, onSave }) {
  const { showSuccess, showError } = useNotification();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role) {
      setName(role.name || '');
      setDescription(role.description || '');
      setError('');
    }
  }, [role]);

  if (!isOpen || !role) return null;

  const isSuperadmin = role.id === 1 || role.name === 'SUPERADMIN';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('El nombre del rol es obligatorio');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      name: name.trim().toUpperCase().replace(/\s+/g, '_'),
      description: description.trim()
    };

    const result = await apiClient.put(`/api/roles/${role.id}`, payload);
    setSaving(false);

    if (result.ok) {
      const updated = result.data?.role || {
        ...role,
        ...payload
      };

      showSuccess(result.message || `Rol "${updated.name}" modificado con éxito`);
      if (onSave) {
        onSave(updated);
      }
      onClose();
    } else {
      showError(result.message, 'Fallo al modificar rol');
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
              <span>✏️</span> Modificar Rol #{role.id}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
              Actualizar descripción o denominación del rol en <strong>pos_rbac.rol</strong>
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
              disabled={isSuperadmin}
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid var(--panel-border)',
                fontSize: '0.86rem',
                fontWeight: 600,
                letterSpacing: '0.5px',
                background: isSuperadmin ? '#f1f3f4' : '#ffffff',
                cursor: isSuperadmin ? 'not-allowed' : 'text'
              }}
            />
            {isSuperadmin && (
              <div style={{ fontSize: '0.72rem', color: '#b06000', marginTop: '4px' }}>
                🔒 El identificador del rol SUPERADMIN no puede ser alterado.
              </div>
            )}
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
              {saving ? 'Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
