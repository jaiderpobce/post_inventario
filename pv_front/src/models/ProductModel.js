export class ProductModel {
  static isWeightBased(product) {
    if (typeof product?.weightBased === 'boolean') {
      return product.weightBased;
    }

    return ['KG', 'KILO', 'KILOGRAMO'].includes(
      String(product?.unit || '').trim().toUpperCase()
    );
  }

  static findProduct(products, query) {
    if (!query) return null;
    const q = query.toLowerCase().trim();
    return products.find(p => 
      [p.code, p.internalCode, p.barcode]
        .some(value => String(value || '').toLowerCase() === q) ||
      p.name.toLowerCase().includes(q)
    );
  }

  static filterProducts(products, query) {
    if (!query) return products;
    const q = query.toLowerCase().trim();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      [p.code, p.internalCode, p.barcode]
        .some(value => String(value || '').toLowerCase().includes(q))
    );
  }

  static createCustomProduct(name, price) {
    return {
      id: Date.now(),
      code: 'GEN-' + Math.floor(1000 + Math.random() * 9000),
      name: name,
      price: price,
      stock: 99,
      unit: 'UND'
    };
  }
}
