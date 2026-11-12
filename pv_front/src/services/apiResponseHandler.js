/**
 * Módulo procesador de respuestas del backend para el frontend
 * Normaliza respuestas HTTP, códigos de estado y mensajes de éxito/error.
 */

// Mensajes por defecto según código de estado HTTP
const DEFAULT_MESSAGES = {
  200: 'Operación realizada con éxito',
  201: 'Registro creado exitosamente en la base de datos',
  202: 'Solicitud aceptada y en procesamiento',
  204: 'Operación completada sin contenido',
  400: 'Datos inválidos o incompletos enviados al servidor',
  401: 'No autorizado: Credenciales incorrectas o sesión expirada',
  403: 'Acceso denegado: No posee los permisos requeridos en el sistema',
  404: 'El registro solicitado no fue encontrado en la base de datos',
  409: 'Conflicto: Ya existe un registro con este código o identificador',
  422: 'Error de validación en los datos proporcionados',
  500: 'Error interno en el servidor o base de datos al procesar la solicitud',
  502: 'Servidor no disponible o fuera de línea',
  503: 'Servicio temporalmente no disponible'
};

/**
 * Procesa la respuesta Fetch nativa del backend y extrae información tipada
 * @param {Response} response - Objeto Response de Fetch
 * @param {Object} [customOptions] - Opciones personalizadas (mensaje override, fallback, etc.)
 * @returns {Promise<{ ok: boolean, status: number, message: string, data: any, type: string }>}
 */
export async function processApiResponse(response, customOptions = {}) {
  const status = response?.status || 500;
  const ok = response ? response.ok : false;

  let parsedData = null;
  let backendMessage = null;

  try {
    const contentType = response?.headers?.get('content-type') || '';
    if (contentType.includes('application/json')) {
      parsedData = await response.json();
    } else {
      const text = await response.text();
      if (text) {
        try {
          parsedData = JSON.parse(text);
        } catch {
          parsedData = text;
        }
      }
    }
  } catch (err) {
    console.warn('No se pudo parsear el cuerpo de la respuesta:', err);
  }

  // Extraer mensaje del backend si viene en formato JSON { message: "...", error: "...", title: "..." }
  if (parsedData && typeof parsedData === 'object') {
    backendMessage = parsedData.message || parsedData.mensaje || parsedData.error || parsedData.title;
    
    // Si viene una lista de errores de validación de Spring Boot:
    if (Array.isArray(parsedData.errors) && parsedData.errors.length > 0) {
      backendMessage = parsedData.errors.map(e => e.defaultMessage || e).join(', ');
    }
  }

  // Definir mensaje final con prioridad: customOptions.message > backendMessage > DEFAULT_MESSAGES
  const finalMessage = customOptions.message || backendMessage || DEFAULT_MESSAGES[status] || (ok ? 'Operación exitosa' : 'Ocurrió un error inesperado');

  // Tipo de notificación: 'success', 'error', 'warning', 'info'
  let type = 'info';
  if (ok) {
    type = 'success';
  } else if (status >= 400 && status < 500) {
    type = status === 403 || status === 401 ? 'warning' : 'error';
  } else if (status >= 500) {
    type = 'error';
  }

  return {
    ok,
    status,
    message: finalMessage,
    data: parsedData,
    type,
    timestamp: new Date().toISOString()
  };
}

/**
 * Procesa errores de red (cuando el fetch falla por corte de conexión, CORS o DNS)
 * @param {Error} error 
 * @param {string} [contextMessage]
 */
export function processNetworkError(error, contextMessage = 'Error de conexión con el servidor') {
  return {
    ok: false,
    status: 0,
    message: error?.message?.includes('Failed to fetch') 
      ? 'No se pudo conectar con el servidor backend. Verifique que los servicios estén activos.'
      : (error?.message || contextMessage),
    data: null,
    type: 'error',
    timestamp: new Date().toISOString()
  };
}
