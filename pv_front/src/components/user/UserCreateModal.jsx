import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';

export default function UserCreateModal({ isOpen, onClose, onUserCreated }) {
  const { showSuccess, showError } = useNotification();

  const [doc, setDoc] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Admin123*');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDoc('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setPassword('Admin123*');
      setShowPassword(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName.trim()) {
      setError('El nombre del operador es obligatorio');
      return;
    }
    if (!email.trim()) {
      setError('El correo electrónico es obligatorio para el inicio de sesión');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      doc: doc.trim().toUpperCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim()
    };

    const result = await apiClient.post('/api/users', payload);
    setSaving(false);

    if (result.ok) {
      const created = result.data?.user || {
        id: Date.now(),
        ...payload,
        role: 'CAJERO',
        roles: ['CAJERO'],
        roleIds: [4],
        status: 'ACTIVO',
        active: true
      };

      showSuccess(result.message || `Usuario "${created.name}" registrado con éxito en pos_rbac`);
      if (onUserCreated) {
        onUserCreated(created);
      }
      onClose();
    } else {
      showError(result.message, 'Fallo al registrar usuario');
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
              <span>👥</span> Nuevo Usuario / Operador
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
              Registrar cuenta de acceso en la base de datos <strong>pos_rbac.usuario</strong>
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

            {/* CONTRASEÑA */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Contraseña de Acceso <span style={{ color: '#ea4335' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Mínimo 6 caracteres"
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
          </div>

          {/* AVISO INFORMATIVO DE ASIGNACIÓN DE ROLES */}
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
            <span style={{ fontSize: '1.2rem' }}>🛡️</span>
            <div>
              <strong>Gestión de Roles RBAC:</strong> Tras registrar al usuario, selecciónelo en la grilla y presione el botón <strong>«🛡️ Roles»</strong> para asignarle uno o múltiples roles específicos.
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
              {saving ? 'Guardando...' : '✓ Guardar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
