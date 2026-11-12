import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import apiClient from '../../services/apiClient';

export default function CustomerCreateModal({ isOpen, onClose, onCustomerCreated }) {
  const { showSuccess, showError } = useNotification();

  const [doc, setDoc] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('Consumidor Final');
  const [creditLimit, setCreditLimit] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDoc('');
      setName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setType('Consumidor Final');
      setCreditLimit('0');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!doc.trim()) {
      setError('El número de documento (Cédula o RIF) es obligatorio');
      return;
    }
    if (!name.trim()) {
      setError('El nombre o razón social del cliente es obligatorio');
      return;
    }

    const numCredit = creditLimit ? parseFloat(creditLimit) : 0;
    if (isNaN(numCredit) || numCredit < 0) {
      setError('Ingrese un límite de crédito válido mayor o igual a 0');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      doc: doc.trim().toUpperCase(),
      name: name.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      address: address.trim(),
      type,
      creditLimit: numCredit
    };

    const result = await apiClient.post('/api/customers', payload);
    setSaving(false);

    if (result.ok) {
      const created = result.data?.customer || {
        id: Date.now(),
        ...payload,
        status: 'ACTIVO'
      };

      showSuccess(result.message || `Cliente "${created.name}" registrado con éxito`);
      if (onCustomerCreated) {
        onCustomerCreated(created);
      }
      onClose();
    } else {
      showError(result.message, 'Fallo al registrar cliente');
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
        <div className="modal-header" style={{ marginBottom: '16px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--google-blue)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <span>👥</span> Registrar Nuevo Cliente
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Ingresa los datos fiscales y de contacto para incorporar al directorio maestro.
            </p>
          </div>
          <button 
            type="button" 
            className="modal-close" 
            onClick={onClose} 
            disabled={saving}
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* ALERTA DE ERROR */}
        {error && (
          <div style={{
            background: '#fce8e6',
            border: '1px solid #fad2cf',
            color: '#c5221f',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '0.86rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* CUERPO DEL FORMULARIO CON SCROLL */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* FILA 1: DOCUMENTO Y TIPO DE CLIENTE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                RIF / Cédula de Identidad <span style={{ color: '#ea4335' }}>*</span>
              </label>
              <input 
                type="text" 
                className="search-input" 
                value={doc} 
                onChange={(e) => setDoc(e.target.value)}
                placeholder="Ej. V-18492018-4 o J-30948201-9"
                required
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Tipo de Cliente / Perfil Fiscal
              </label>
              <select 
                className="search-input" 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="Consumidor Final">Consumidor Final</option>
                <option value="Contribuyente Especial">Contribuyente Especial</option>
                <option value="Cliente VIP / Crédito">Cliente VIP / Crédito</option>
                <option value="Gobierno / Institucional">Gobierno / Institucional</option>
              </select>
            </div>
          </div>

          {/* FILA 2: NOMBRE Y APELLIDO / RAZÓN SOCIAL */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Nombre o Razón Social <span style={{ color: '#ea4335' }}>*</span>
              </label>
              <input 
                type="text" 
                className="search-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Distribuidora Polar o Carlos"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Apellido / Denominación
              </label>
              <input 
                type="text" 
                className="search-input" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej. C.A. / Mendoza"
              />
            </div>
          </div>

          {/* FILA 3: TELÉFONO Y CORREO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Teléfono de Contacto
              </label>
              <input 
                type="text" 
                className="search-input" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 0412-1234567"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Correo Electrónico
              </label>
              <input 
                type="email" 
                className="search-input" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej. cliente@empresa.com"
              />
            </div>
          </div>

          {/* FILA 4: LÍMITE DE CRÉDITO */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Límite de Crédito Autorizado ($)
            </label>
            <input 
              type="number" 
              step="0.01" 
              min="0"
              className="search-input" 
              value={creditLimit} 
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="0.00"
            />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
              Monto máximo permitido para compras a cuenta o crédito pendiente.
            </span>
          </div>

          {/* FILA 5: DIRECCIÓN */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Dirección Fiscal / Domicilio
            </label>
            <textarea 
              className="search-input" 
              rows={2} 
              value={address} 
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej. Calle 10, Edificio Los Robles, Valencia, Edo. Carabobo"
              style={{ resize: 'vertical', minHeight: '50px' }}
            />
          </div>

          {/* BOTONERA ACCIONES */}
          <div className="modal-actions" style={{ marginTop: '12px', borderTop: '1px solid var(--panel-border)', paddingTop: '14px' }}>
            <button 
              type="button" 
              className="btn-modal secondary" 
              onClick={onClose} 
              disabled={saving}
            >
              Cancelar (Esc)
            </button>
            <button 
              type="submit" 
              className="btn-modal primary" 
              disabled={saving}
              style={{ minWidth: '150px' }}
            >
              {saving ? 'Guardando...' : '✓ Guardar Cliente'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
