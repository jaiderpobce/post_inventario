import { useState, useEffect, useCallback } from 'react';
import { ClientesModel } from '../models/ClientesModel';

export function useClientesController() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', icon: '✨' });

  const showToast = useCallback((msg, icon = '✨') => {
    setToast({ show: true, message: msg, icon });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2800);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/clientes');
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Endpoint /api/clientes no disponible aún o error:', err);
      setError('No se pudo conectar con el servidor para cargar Clientes.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenNew = () => {
    setSelectedItem(ClientesModel.createEmptyItem());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem({ ...item });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleSaveItem = async (itemData) => {
    const { isValid, errors } = ClientesModel.validate(itemData);
    if (!isValid) {
      showToast(errors[0], '⚠️');
      return false;
    }

    try {
      const isEdit = !!itemData.id;
      const url = isEdit ? `/api/clientes/${itemData.id}` : '/api/clientes';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });

      if (!res.ok) throw new Error('Error al guardar en el servidor');
      showToast(`✅ ${isEdit ? 'Actualizado' : 'Registrado'} con éxito`);
      handleCloseModal();
      loadData();
      return true;
    } catch (err) {
      console.error(err);
      showToast('❌ Error al guardar datos', '⚠️');
      return false;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este registro?')) return;
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      showToast('🗑️ Registro eliminado');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('❌ No se pudo eliminar', '⚠️');
    }
  };

  const filteredItems = ClientesModel.filterItems(items, searchTerm);

  return {
    items: filteredItems,
    totalCount: items.length,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedItem,
    isModalOpen,
    toast,
    showToast,
    loadData,
    handleOpenNew,
    handleOpenEdit,
    handleCloseModal,
    handleSaveItem,
    handleDelete
  };
}
