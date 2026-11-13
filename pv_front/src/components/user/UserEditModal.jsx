import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';

export default function UserEditModal({ isOpen, onClose, user, onSave }) {
  const { showSuccess, showError } = useNotification();

  const [doc, setDoc] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('CAJERO');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('ACTIVO');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setDoc(user.doc || '');
      setFirstName(user.firstName || user.name || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setRole(user.role || 'CAJERO');
      setPassword('');
      setShowPassword(false);
      setStatus(user.status || (user.active ? 'ACTIVO' : 'SUSPENDIDO'));
      setError('');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName.trim()) {
      setError('El nombre del usuario es obligatorio');
      return;
    }
    if (!email.trim()) {
      setError('El correo electrónico es obligatorio');
      return;
    }
    if (password.trim() && password.trim().length < 6) {
      setError('Si modifica la contraseña, debe tener al menos 6 caracteres');
      return;
    }

    setSaving(true);
    setError('');

    const roleMap = {
      'SUPERADMIN': 1,
      'ADMINISTRADOR': 2,
      'SUPERVISOR': 3,
      'CAJERO': 4
    };

    const payload = {
      doc: doc.trim().toUpperCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      role,
      roleId: roleMap[role] || 4,
      status,
      password: password.trim() ? password.trim() : null
    };

    const result = await apiClient.put(`/api/users/${user.id}`, payload);
    setSaving(false);

    if (result.ok) {
      const updated = result.data?.user || {
        ...user,
        ...payload,
        active: status === 'ACTIVO'
      };

      showSuccess(result.message || 'Usuario modificado con éxito en la base de datos');
      if (onSave) {
        onSave(updated);
      }
      onClose();
    } else {
      showError(result.message, 'Fallo al modificar usuario');
      setError(result.message);
    }
  };

  return (
    <div className="modal-overlay active" style={{ zIndex: 1100 }}>
      <div 
        className="modal-box" 
        style={{ 
          width: '660px', 
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
              <span>✏️</span> Modificar Usuario #{user.id}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
              Actualizar credenciales y permisos RBAC en <strong>pos_rbac.usuario</strong>
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
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', paddingRight: '4px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {/* CÉDULA / RIF */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Cédula / Documento
              </label>
              <input
                type="text"
                placeholder="Ej. V-18492018"
                value={doc}
                onChange={(e) => setDoc(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)',
                  fontSize: '0.86rem',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {/* TELÉFONO */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Teléfono de Contacto
              </label>
              <input
                type="text"
                placeholder="Ej. 0414-5551234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)',
                  fontSize: '0.86rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {/* NOMBRE */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Nombre(s) <span style={{ color: '#ea4335' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Carlos"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)',
                  fontSize: '0.86rem'
                }}
              />
            </div>

            {/* APELLIDO */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Apellido(s)
              </label>
              <input
                type="text"
                placeholder="Ej. Mendoza"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)',
                  fontSize: '0.86rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {/* CORREO ELECTRÓNICO (USUARIO) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Correo Electrónico (Login) <span style={{ color: '#ea4335' }}>*</span>
              </label>
              <input
                type="email"
                required
                placeholder="carlos@sistema.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)',
                  fontSize: '0.86rem'
                }}
              />
            </div>

            {/* ROL ASIGNADO */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Rol RBAC del Sistema <span style={{ color: '#ea4335' }}>*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)',
                  fontSize: '0.86rem',
                  background: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <option value="CAJERO">💳 CAJERO (Punto de Venta)</option>
                <option value="SUPERVISOR">🔍 SUPERVISOR (Caja y Reportes)</option>
                <option value="ADMINISTRADOR">💼 ADMINISTRADOR (Gestión Operativa)</option>
                <option value="SUPERADMIN">👑 SUPERADMIN (Control Total)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {/* CAMBIAR CONTRASEÑA */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Nueva Contraseña (Opcional)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Dejar en blanco para no cambiar"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 40px 9px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--panel-border)',
                    fontSize: '0.86rem',
                    fontFamily: showPassword ? 'inherit' : 'monospace'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: 'var(--text-dim)',
                    padding: '4px'
                  }}
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* ESTADO */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Estado de la Cuenta
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)',
                  fontSize: '0.86rem',
                  background: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <option value="ACTIVO">● Activo (Acceso Habilitado)</option>
                <option value="SUSPENDIDO">⏸️ Suspendido (Acceso Bloqueado)</option>
              </select>
            </div>
          </div>

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
