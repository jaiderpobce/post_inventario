import { INITIAL_CUSTOMERS } from '../data/mockData';

export class CustomerModel {
  static getInitialCustomers() {
    return [...INITIAL_CUSTOMERS];
  }

  static filterCustomers(customers, query) {
    if (!query) return customers;
    const q = query.toLowerCase().trim();
    return customers.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.doc && c.doc.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.type && c.type.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  }

  static createCustomer(data) {
    return {
      id: Date.now(),
      doc: data.doc || 'V-00000000-0',
      name: data.name,
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || 'Sin dirección',
      type: data.type || 'Consumidor Final'
    };
  }
}
