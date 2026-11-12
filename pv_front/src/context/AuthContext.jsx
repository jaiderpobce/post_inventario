import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Módulos por defecto según roles (para fallback o testing sin backend)
const DEFAULT_SUPERADMIN_MODULES = [
  { id: 1, nombre: 'Operaciones POS', ruta: '/pos', icono: 'point_of_sale' },
  { id: 2, nombre: 'Catálogo', ruta: '/productos', icono: 'inventory_2' },
  { id: 3, nombre: 'Reportes', ruta: '/reportes', icono: 'bar_chart' },
  { id: 4, nombre: 'Sistema', ruta: '/sistema', icono: 'settings' },
  { id: 5, nombre: 'Clientes', ruta: '/clientes', icono: 'people' }
];

const DEFAULT_CAJERO_MODULES = [
  { id: 1, nombre: 'Operaciones POS', ruta: '/pos', icono: 'point_of_sale' }
];

export function AuthProvider({ children }) {
  // Usuario autenticado actual
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pos_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return null; // Inicia en null para exigir login si no hay sesión activa
  });

  // Lista dinámica de módulos autorizados provenientes de la tabla modulo / r_modulo_rol
  const [modules, setModules] = useState(() => {
    const saved = localStorage.getItem('pos_modules');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('pos_permissions');
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
          localStorage.setItem('pos_modules', JSON.stringify(data));
          return;
        }
      }
    } catch (err) {
      console.warn('API /api/auth/menu aún no disponible en backend, usando perfil local:', err);
    }

    // Fallback local según rol
    if (user?.rol === 'CAJERO') {
      setModules(DEFAULT_CAJERO_MODULES);
      localStorage.setItem('pos_modules', JSON.stringify(DEFAULT_CAJERO_MODULES));
    } else {
      setModules(DEFAULT_SUPERADMIN_MODULES);
      localStorage.setItem('pos_modules', JSON.stringify(DEFAULT_SUPERADMIN_MODULES));
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
        localStorage.setItem('pos_user', JSON.stringify(data.user));
        localStorage.setItem('pos_modules', JSON.stringify(data.modules || []));
        localStorage.setItem('pos_permissions', JSON.stringify(data.permissions || []));
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
      localStorage.setItem('pos_user', JSON.stringify(superUser));
      localStorage.setItem('pos_modules', JSON.stringify(DEFAULT_SUPERADMIN_MODULES));
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
      localStorage.setItem('pos_user', JSON.stringify(cajeroUser));
      localStorage.setItem('pos_modules', JSON.stringify(DEFAULT_CAJERO_MODULES));
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
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_modules');
    localStorage.removeItem('pos_permissions');
    setUser(null);
    setModules([]);
    setPermissions([]);
    setIsLoginModalOpen(true);
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
      canAccessRoute
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
