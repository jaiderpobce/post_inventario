export class UserModel {
  /**
   * Filtra la lista de usuarios según el texto de búsqueda (nombre, documento, correo, teléfono, rol o estado)
   */
  static filterUsers(users, query) {
    if (!query) return users;
    const q = query.toLowerCase().trim();
    return users.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.firstName && u.firstName.toLowerCase().includes(q)) ||
      (u.lastName && u.lastName.toLowerCase().includes(q)) ||
      (u.doc && u.doc.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.status && u.status.toLowerCase().includes(q))
    );
  }

  /**
   * Retorna estilos de badge consistentes según el rol del usuario
   */
  static getRoleBadgeStyle(role) {
    const r = (role || '').toUpperCase();
    switch (r) {
      case 'SUPERADMIN':
        return {
          background: '#e8f0fe',
          color: 'var(--google-blue)',
          border: '1px solid #c2e7ff',
          label: '👑 SUPERADMIN'
        };
      case 'ADMINISTRADOR':
        return {
          background: '#fef7e0',
          color: '#b06000',
          border: '1px solid #f9ab00',
          label: '💼 ADMINISTRADOR'
        };
      case 'SUPERVISOR':
        return {
          background: '#f3e8fd',
          color: '#8430ce',
          border: '1px solid #d2a4f9',
          label: '🔍 SUPERVISOR'
        };
      case 'CAJERO':
      default:
        return {
          background: '#e6f4ea',
          color: 'var(--google-green)',
          border: '1px solid #ceead6',
          label: '💳 CAJERO'
        };
    }
  }

  /**
   * Retorna estilos de badge según el estado del operador
   */
  static getStatusBadgeStyle(status) {
    const isSuspended = status === 'SUSPENDIDO' || status === 'INACTIVO';
    return {
      background: isSuspended ? '#fef7e0' : '#e6f4ea',
      color: isSuspended ? '#b06000' : '#137333',
      border: isSuspended ? '1px solid #f9ab00' : '1px solid #ceead6',
      label: isSuspended ? '⏸️ Suspendido' : '● Activo'
    };
  }
}
