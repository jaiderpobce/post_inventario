import { INITIAL_CUSTOMERS } from '../data/mockData';

export class CustomerModel {
  static getInitialCustomers() {
    return [...INITIAL_CUSTOMERS];
  }

  static filterCustomers(customers, query) {
    if (!query) return customers;
    const q = query.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.doc.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
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
