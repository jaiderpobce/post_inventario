import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Módulos y submódulos (vistas) por defecto según roles (para fallback o testing sin backend)
const DEFAULT_SUPERADMIN_MODULES = [
  { 
    id: 1, 
    nombre: 'Operaciones POS', 
    ruta: '/pos', 
    icono: 'point_of_sale',
    submodulos: [
      { id: 1, id_modulo: 1, nombre: 'Terminal POS', icono: 'point_of_sale', ruta: '/pos', orden: 1, descripcion: 'Pantalla principal de venta y cobro' }
    ]
  },
  { 
    id: 2, 
    nombre: 'Administración', 
    ruta: '/administracion', 
    icono: 'admin_panel_settings',
    submodulos: [
      { id: 20, id_modulo: 2, nombre: 'Productos y Catálogo', icono: 'inventory_2', ruta: '/administracion/productos', orden: 1, descripcion: 'Gestión de precios, costos y códigos de barras' },
      { id: 21, id_modulo: 2, nombre: 'Clientes y Cuentas', icono: 'people', ruta: '/administracion/clientes', orden: 2, descripcion: 'Directorio de clientes, RIF/cédula y crédito' },
      { id: 22, id_modulo: 2, nombre: 'Compras a Proveedores', icono: 'shopping_cart', ruta: '/administracion/compras', orden: 3, descripcion: 'Recepción de mercancía y facturas de compra' },
      { id: 23, id_modulo: 2, nombre: 'Inventario y Almacén', icono: 'warehouse', ruta: '/administracion/inventario', orden: 4, descripcion: 'Existencias por almacén, ajustes y kardex' },
      { id: 24, id_modulo: 2, nombre: 'Categorías y Medidas', icono: 'category', ruta: '/administracion/categorias', orden: 5, descripcion: 'Departamentos de productos y unidades de medida' }
    ]
  },
  { 
    id: 3, 
    nombre: 'Reportes', 
    ruta: '/reportes', 
    icono: 'bar_chart',
    submodulos: [
      { id: 30, id_modulo: 3, nombre: 'Cierre de Caja (Corte X/Z)', icono: 'receipt_long', ruta: '/reportes/cierre', orden: 1, descripcion: 'Arqueo de caja y comprobantes fiscales' },
      { id: 31, id_modulo: 3, nombre: 'Ventas y Facturación', icono: 'bar_chart', ruta: '/reportes/ventas', orden: 2, descripcion: 'Estadísticas de ventas diarias y mensuales' },
      { id: 32, id_modulo: 3, nombre: 'Auditoría y Trazabilidad', icono: 'analytics', ruta: '/reportes/auditoria', orden: 3, descripcion: 'Historial de modificaciones y seguridad' }
    ]
  },
  { 
    id: 4, 
    nombre: 'Sistema', 
    ruta: '/sistema', 
    icono: 'settings',
    submodulos: [
      { id: 40, id_modulo: 4, nombre: 'Usuarios y Cuentas', icono: 'manage_accounts', ruta: '/sistema/usuarios', orden: 1, descripcion: 'Operadores, cajeros y credenciales de acceso' },
      { id: 41, id_modulo: 4, nombre: 'Roles y Permisos (RBAC)', icono: 'security', ruta: '/sistema/roles', orden: 2, descripcion: 'Matriz de control de acceso y privilegios' },
      { id: 42, id_modulo: 4, nombre: 'Terminales y Cajas', icono: 'point_of_sale', ruta: '/sistema/cajas', orden: 3, descripcion: 'Puntos de venta físicos y turnos de caja' },
      { id: 43, id_modulo: 4, nombre: 'Impresoras y Hardware', icono: 'print', ruta: '/sistema/hardware', orden: 4, descripcion: 'Ticketeras fiscales, impresoras y balanzas' },
      { id: 44, id_modulo: 4, nombre: 'Logs de Auditoría', icono: 'history', ruta: '/sistema/auditoria-logs', orden: 5, descripcion: 'Registro de eventos de seguridad del sistema' },
      { id: 45, id_modulo: 4, nombre: 'Parámetros Generales', icono: 'tune', ruta: '/sistema/general', orden: 6, descripcion: 'Moneda base, tasa de IVA y datos fiscales' }
    ]
  }
];

const DEFAULT_CAJERO_MODULES = [
  { 
    id: 1, 
    nombre: 'Operaciones POS', 
    ruta: '/pos', 
    icono: 'point_of_sale',
    submodulos: [
      { id: 1, id_modulo: 1, nombre: 'Terminal POS', icono: 'point_of_sale', ruta: '/pos', orden: 1, descripcion: 'Pantalla principal de venta y cobro' }
    ]
  }
];

export function AuthProvider({ children }) {
  // Usuario autenticado actual en la sesión activa (sessionStorage)
  const [user, setUser] = useState(() => {
    const sessionSaved = sessionStorage.getItem('pos_user');
    if (sessionSaved) {
      try { return JSON.parse(sessionSaved); } catch (e) { /* ignore */ }
    }
    // Si había un guardado residual en localStorage de sesiones anteriores, lo limpiamos para exigir login al entrar
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_modules');
    localStorage.removeItem('pos_permissions');
    return null; // Inicia en null para exigir login al entrar a la aplicación
  });

  // Lista dinámica de módulos autorizados provenientes de la tabla modulo / r_modulo_rol
  const [modules, setModules] = useState(() => {
    const saved = sessionStorage.getItem('pos_modules');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [permissions, setPermissions] = useState(() => {
    const saved = sessionStorage.getItem('pos_permissions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return ['ACCESO_VISTA', 'REGISTRAR_VENTA', 'ANULAR_VENTA', 'ELIMINAR_ITEM', 'MODIFICAR_PRECIO'];
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Función para cargar los módulos autorizados desde la API del backend
  const fetchUserMenu = useCallback(async (userId) => {
    try {
      const res = await fetch(`/api/auth/menu?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setModules(data);
          sessionStorage.setItem('pos_modules', JSON.stringify(data));
          return;
        }
      }
    } catch (err) {
      console.warn('API /api/auth/menu aún no disponible en backend, usando perfil local:', err);
    }

    // Fallback local según rol
    if (user?.rol === 'CAJERO') {
      setModules(DEFAULT_CAJERO_MODULES);
      sessionStorage.setItem('pos_modules', JSON.stringify(DEFAULT_CAJERO_MODULES));
    } else {
      setModules(DEFAULT_SUPERADMIN_MODULES);
      sessionStorage.setItem('pos_modules', JSON.stringify(DEFAULT_SUPERADMIN_MODULES));
    }
  }, [user?.rol]);

  useEffect(() => {
    if (user?.id) {
      fetchUserMenu(user.id);
    }
  }, [user?.id, fetchUserMenu]);

  // Iniciar sesión
  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setModules(data.modules || []);
        setPermissions(data.permissions || []);
        sessionStorage.setItem('pos_user', JSON.stringify(data.user));
        sessionStorage.setItem('pos_modules', JSON.stringify(data.modules || []));
        sessionStorage.setItem('pos_permissions', JSON.stringify(data.permissions || []));
        localStorage.removeItem('pos_user');
        localStorage.removeItem('pos_modules');
        localStorage.removeItem('pos_permissions');
        setIsLoginModalOpen(false);
        return { success: true };
      }
    } catch (err) {
      console.warn('Error conectando a /api/auth/login, validando usuarios semilla locales:', err);
    }

    // Validación con los usuarios semilla registrados en pos_rbac
    if (email === 'superadmin@sistema.com' && (password === 'SuperAdmin123*' || password === 'admin')) {
      const superUser = {
        id: 1,
        nombre: 'Super',
        apellido: 'Administrador',
        email: 'superadmin@sistema.com',
        rol: 'SUPERADMIN'
      };
      setUser(superUser);
      setModules(DEFAULT_SUPERADMIN_MODULES);
      setPermissions(['ALL']);
      sessionStorage.setItem('pos_user', JSON.stringify(superUser));
      sessionStorage.setItem('pos_modules', JSON.stringify(DEFAULT_SUPERADMIN_MODULES));
      localStorage.removeItem('pos_user');
      setIsLoginModalOpen(false);
      return { success: true };
    } else if (email === 'cajero@sistema.com' && (password === 'Admin123*' || password === 'admin')) {
      const cajeroUser = {
        id: 3,
        nombre: 'Cajero',
        apellido: 'Principal',
        email: 'cajero@sistema.com',
        rol: 'CAJERO'
      };
      setUser(cajeroUser);
      setModules(DEFAULT_CAJERO_MODULES);
      setPermissions(['ACCESO_VISTA', 'REGISTRAR_VENTA', 'ELIMINAR_ITEM']);
      sessionStorage.setItem('pos_user', JSON.stringify(cajeroUser));
      sessionStorage.setItem('pos_modules', JSON.stringify(DEFAULT_CAJERO_MODULES));
      localStorage.removeItem('pos_user');
      setIsLoginModalOpen(false);
      return { success: true };
    }

    return { success: false, message: 'Credenciales inválidas. Verifique correo y contraseña.' };
  };

  // Cambio rápido entre Superadmin y Cajero (ideal para pruebas y demostraciones en vivo)
  const switchRole = (roleType) => {
    if (roleType === 'CAJERO') {
      login('cajero@sistema.com', 'Admin123*');
    } else {
      login('superadmin@sistema.com', 'SuperAdmin123*');
    }
  };

  // Cerrar sesión
  const logout = () => {
    sessionStorage.removeItem('pos_user');
    sessionStorage.removeItem('pos_modules');
    sessionStorage.removeItem('pos_permissions');
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_modules');
    localStorage.removeItem('pos_permissions');
    setUser(null);
    setModules([]);
    setPermissions([]);
    setIsLoginModalOpen(false);
  };

  // Helper para verificar si tiene un permiso específico
  const hasPermission = (permissionName) => {
    if (user?.rol === 'SUPERADMIN') return true;
    return permissions.includes(permissionName);
  };

  // Helper para verificar si tiene acceso a una ruta
  const canAccessRoute = (routePath) => {
    if (user?.rol === 'SUPERADMIN') return true;
    return modules.some(m => m.ruta === routePath);
  };

  // Helper para obtener los submódulos de un módulo específico (cargados dinámicamente desde pos_rbac.vistas)
  const getSubmodules = useCallback((moduleRouteOrId) => {
    const mod = modules.find(m => 
      m.id === moduleRouteOrId || 
      m.ruta === moduleRouteOrId ||
      String(m.nombre).toLowerCase().includes(String(moduleRouteOrId).replace('/', '').toLowerCase())
    );
    return mod?.submodulos || [];
  }, [modules]);

  return (
    <AuthContext.Provider value={{
      user,
      modules,
      permissions,
      isAuthenticated: !!user,
      isLoginModalOpen,
      setIsLoginModalOpen,
      login,
      logout,
      switchRole,
      hasPermission,
      canAccessRoute,
      getSubmodules
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
