import React, { createContext, useContext, useState, useCallback } from 'react';
import { processApiResponse, processNetworkError } from '../services/apiResponseHandler';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  // Eliminar notificación por ID
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Agregar notificación genérica
  const addNotification = useCallback(({ message, title, type = 'info', duration = 3800 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newNotif = { id, message, title, type, duration };

    setNotifications((prev) => [...prev, newNotif]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    return id;
  }, [removeNotification]);

  // Métodos rápidos de notificación
  const showSuccess = useCallback((message, title = 'Operación Exitosa') => {
    return addNotification({ message, title, type: 'success' });
  }, [addNotification]);

  const showError = useCallback((message, title = 'Error') => {
    return addNotification({ message, title, type: 'error', duration: 5000 });
  }, [addNotification]);

  const showWarning = useCallback((message, title = 'Atención') => {
    return addNotification({ message, title, type: 'warning' });
  }, [addNotification]);

  const showInfo = useCallback((message, title = 'Información') => {
    return addNotification({ message, title, type: 'info' });
  }, [addNotification]);

  /**
   * Procesa la respuesta de un fetch del backend y muestra automáticamente el toast correspondiente
   * @param {Response} response - Objeto Response nativo
   * @param {Object} [options] - Opciones personalizadas de mensaje
   * @returns {Promise<{ ok: boolean, status: number, message: string, data: any, type: string }>}
   */
  const handleResponse = useCallback(async (response, options = {}) => {
    const result = await processApiResponse(response, options);
    if (result.ok) {
      showSuccess(result.message, options.successTitle || 'Éxito');
    } else {
      showError(result.message, options.errorTitle || `Error ${result.status}`);
    }
    return result;
  }, [showSuccess, showError]);

  /**
   * Procesa un error de red y muestra la alerta
   */
  const handleNetworkError = useCallback((error, fallbackMessage) => {
    const result = processNetworkError(error, fallbackMessage);
    showError(result.message, 'Fallo de Red');
    return result;
  }, [showError]);

  return (
    <NotificationContext.Provider value={{
      showSuccess,
      showError,
      showWarning,
      showInfo,
      handleResponse,
      handleNetworkError,
      removeNotification
    }}>
      {children}

      {/* ========================================================
          CONTENEDOR FLOTANTE DE NOTIFICACIONES (TOASTS)
         ======================================================== */}
      <div 
        style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          width: 'calc(100% - 48px)',
          pointerEvents: 'none'
        }}
      >
        {notifications.map((n) => {
          // Estilos según el tipo de notificación
          let bg = '#ffffff';
          let border = '#dadce0';
          let textColor = '#202124';
          let icon = 'ℹ️';

          if (n.type === 'success') {
            bg = '#e6f4ea';
            border = '#34a853';
            textColor = '#137333';
            icon = '✅';
          } else if (n.type === 'error') {
            bg = '#fce8e6';
            border = '#ea4335';
            textColor = '#c5221f';
            icon = '❌';
          } else if (n.type === 'warning') {
            bg = '#fef7e0';
            border = '#f9ab00';
            textColor = '#b06000';
            icon = '⚠️';
          }

          return (
            <div
              key={n.id}
              style={{
                pointerEvents: 'auto',
                background: bg,
                border: `1px solid ${border}`,
                borderLeft: `5px solid ${border}`,
                borderRadius: '14px',
                padding: '12px 16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                {n.title && (
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: textColor, marginBottom: '2px' }}>
                    {n.title}
                  </div>
                )}
                <div style={{ fontSize: '0.82rem', color: textColor, lineHeight: 1.4, fontWeight: 500 }}>
                  {n.message}
                </div>
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: textColor,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  opacity: 0.65,
                  padding: '2px 4px'
                }}
                title="Cerrar notificación"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe ser utilizado dentro de un NotificationProvider');
  }
  return context;
}
