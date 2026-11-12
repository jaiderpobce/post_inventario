import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Header from './components/common/Header';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <AppRoutes />
    </BrowserRouter>
  );
}
