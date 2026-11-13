import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginView() {
  const { user, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor ingrese su correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      const res = await login(email.trim(), password);
      if (res.success) {
        navigate('/pos', { replace: true });
      } else {
        setErrorMessage(res.message || 'Credenciales inválidas. Intente nuevamente.');
      }
    } catch (err) {
      console.error('Error durante el inicio de sesión:', err);
      setErrorMessage('Error al conectar con el servicio de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  // Atajos para pruebas rápidas
  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setErrorMessage('');
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        border: '1px solid var(--panel-border)',
        borderRadius: '24px',
        padding: '36px 32px',
        boxShadow: 'var(--shadow-main)',
        position: 'relative',
        zIndex: 2
      }}>
        
        {/* LOGO Y ENCABEZADO */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--google-blue), var(--google-blue-dark))',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            fontWeight: 900,
            fontFamily: 'Outfit, sans-serif',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 20px rgba(26, 115, 232, 0.35)'
          }}>
            G
          </div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.6rem', color: 'var(--text-main)', marginBottom: '6px' }}>
            Iniciar Sesión
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Acceda con sus credenciales autorizadas en <strong>pos_rbac</strong>
          </p>
        </div>

        {/* BANNER INFORMATIVO SI YA HAY SESIÓN ACTIVA */}
        {isAuthenticated && user && (
          <div style={{
            background: '#e8f0fe',
            border: '1px solid #c2e7ff',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.74rem' }}>Sesión activa en curso:</span>
              <strong style={{ color: 'var(--google-blue)' }}>{user.nombre} {user.apellido}</strong> <span style={{ fontSize: '0.72rem', background: '#ffffff', border: '1px solid #c2e7ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, marginLeft: '4px' }}>{user.rol}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/pos')}
              className="btn-quick-add"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              Entrar al POS →
            </button>
          </div>
        )}

        {/* MENSAJE DE ERROR */}
        {errorMessage && (
          <div style={{
            background: '#fce8e6',
            color: '#c5221f',
            border: '1px solid #fad2cf',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* FORMULARIO DE ACCESO */}
        <form onSubmit={handleSubmit}>
          {/* CAMPO EMAIL */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
              Correo electrónico
            </label>
            <div className="search-input-wrapper" style={{ border: '1.5px solid var(--panel-border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>✉️</span>
              <input 
                type="email" 
                className="search-input" 
                placeholder="ej: superadmin@sistema.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                style={{ fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* CAMPO CONTRASEÑA */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
              Contraseña
            </label>
            <div className="search-input-wrapper" style={{ border: '1.5px solid var(--panel-border)', borderRadius: '12px' }}>
              <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>🔒</span>
              <input 
                type={showPassword ? 'text' : 'password'}
                className="search-input" 
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ fontSize: '0.9rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-dim)',
                  fontSize: '1rem',
                  padding: '4px'
                }}
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* BOTÓN SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              background: loading ? '#80868b' : 'var(--google-blue)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(26, 115, 232, 0.3)',
              transition: 'var(--transition)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? 'Verificando credenciales...' : 'Ingresar al Sistema'}
          </button>
        </form>

        {/* ACCESOS RÁPIDOS DE PRUEBA (DEMO / TESTING) */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--panel-border)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '10px', fontWeight: 600 }}>
            ACCESO RÁPIDO CON USUARIOS DE LA BASE DE DATOS:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('superadmin@sistema.com', 'SuperAdmin123*')}
              style={{
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid #c2e7ff',
                background: '#f0f8ff',
                color: 'var(--google-blue)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              👑 Superadmin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('cajero@sistema.com', 'Admin123*')}
              style={{
                padding: '8px',
                borderRadius: '10px',
                border: '1px solid #cbf0d8',
                background: '#f2faf5',
                color: 'var(--google-green)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🛒 Cajero
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
