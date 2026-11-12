import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PosView from '../views/PosView';
import ProductsView from '../views/ProductsView';
import ReportsView from '../views/ReportsView';
import SystemView from '../views/SystemView';
import ClientesView from '../views/ClientesView';

// Componente para proteger el acceso a rutas según los módulos autorizados en el RBAC
function ProtectedRoute({ route, children }) {
  const { canAccessRoute } = useAuth();
  if (!canAccessRoute(route)) {
    return <Navigate to="/pos" replace />;
  }
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* MÓDULO 1: PUNTO DE VENTA (POS) */}
      <Route path="/" element={<Navigate to="/pos" replace />} />
      <Route path="/pos" element={<ProtectedRoute route="/pos"><PosView /></ProtectedRoute>} />

      {/* MÓDULO 2: INVENTARIO Y CATÁLOGO */}
      <Route path="/productos" element={<ProtectedRoute route="/productos"><ProductsView /></ProtectedRoute>} />

      {/* MÓDULO 3: REPORTES Y AUDITORÍA */}
      <Route path="/reportes" element={<ProtectedRoute route="/reportes"><ReportsView /></ProtectedRoute>} />
      <Route path="/reports" element={<Navigate to="/reportes" replace />} />

      {/* MÓDULO 4: CONFIGURACIÓN Y SEGURIDAD */}
      <Route path="/sistema" element={<ProtectedRoute route="/sistema"><SystemView /></ProtectedRoute>} />
      <Route path="/system" element={<Navigate to="/sistema" replace />} />

      {/* MÓDULO: CLIENTES */}
      <Route path="/clientes" element={<ProtectedRoute route="/clientes"><ClientesView /></ProtectedRoute>} />

      {/* RUTA POR DEFECTO */}
      <Route path="*" element={<Navigate to="/pos" replace />} />
    </Routes>
  );
}
