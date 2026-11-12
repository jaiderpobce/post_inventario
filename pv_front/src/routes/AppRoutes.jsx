import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PosView from '../views/PosView';
import ReportsView from '../views/ReportsView';
import SystemView from '../views/SystemView';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PosView />} />
      <Route path="/reports" element={<ReportsView />} />
      <Route path="/system" element={<SystemView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
