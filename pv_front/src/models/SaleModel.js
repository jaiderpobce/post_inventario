import { TAX_RATE } from '../data/mockData';

export class SaleModel {
  static calculateRowTotals(item) {
    if (!item) return { subtotal: 0, tax: 0, total: 0, rowTax: 0 };
    const price = item.price || 0;
    const qty = item.qty || 1;
    const subtotal = price * qty;
    const tax = subtotal * (item.ivaRate ?? TAX_RATE);
    const total = subtotal + tax;
    return { subtotal, tax, total, rowTax: tax };
  }

  static calculateSaleTotals(cart) {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const iva = cart.reduce((sum, item) => sum + SaleModel.calculateRowTotals(item).tax, 0);
    const total = subtotal + iva;
    const lineCount = cart.length;
    const itemTotalCount = cart.reduce((sum, item) => sum + item.qty, 0);

    return {
      subtotal,
      iva,
      total,
      lineCount,
      itemTotalCount
    };
  }

  static addItemToCart(cart, product) {
    const existingIdx = cart.findIndex(i => i.id === product.id);
    if (existingIdx >= 0) {
      const updated = [...cart];
      updated[existingIdx] = {
        ...updated[existingIdx],
        qty: updated[existingIdx].qty + 1
      };
      return { cart: updated, targetIndex: existingIdx };
    } else {
      const newCart = [...cart, { ...product, qty: 1 }];
      return { cart: newCart, targetIndex: newCart.length - 1 };
    }
  }

  static updateItemQuantity(cart, index, newQty) {
    if (!cart[index]) return cart;
    if (newQty <= 0) {
      return cart.filter((_, i) => i !== index);
    }
    const updated = [...cart];
    updated[index] = { ...updated[index], qty: newQty };
    return updated;
  }
}
