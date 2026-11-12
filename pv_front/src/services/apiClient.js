import { processApiResponse, processNetworkError } from './apiResponseHandler';

/**
 * Cliente HTTP unificado con procesamiento automático de respuestas
 */
async function request(url, { method = 'GET', body, headers = {}, ...customOptions } = {}) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    ...customOptions
  };

  if (body !== undefined) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    return await processApiResponse(response, customOptions);
  } catch (error) {
    console.error(`Error en petición ${method} ${url}:`, error);
    return processNetworkError(error);
  }
}

export const apiClient = {
  get: (url, options) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options) => request(url, { ...options, method: 'POST', body }),
  put: (url, body, options) => request(url, { ...options, method: 'PUT', body }),
  patch: (url, body, options) => request(url, { ...options, method: 'PATCH', body }),
  delete: (url, options) => request(url, { ...options, method: 'DELETE' })
};

export default apiClient;
