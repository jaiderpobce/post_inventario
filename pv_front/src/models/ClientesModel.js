/**
 * Modelo de negocio y validaciones para: Clientes
 */
export class ClientesModel {
  static filterItems(items, query) {
    if (!query) return items;
    const q = query.toLowerCase().trim();
    return items.filter(item => 
      Object.values(item).some(val => 
        String(val || '').toLowerCase().includes(q)
      )
    );
  }

  static createEmptyItem() {
    return {
      id: null,
      nombre: '',
      descripcion: '',
      estado: 'ACTIVO'
    };
  }

  static validate(item) {
    const errors = [];
    if (!item.nombre || !item.nombre.trim()) {
      errors.push('El nombre es obligatorio.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
