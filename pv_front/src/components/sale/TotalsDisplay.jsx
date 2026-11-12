import React from 'react';

export default function TotalsDisplay({ subtotal, iva, total }) {
  return (
    <div className="top-totals-col">
      <div className="display-group">
        <span className="display-label">SUBTOTAL</span>
        <span className="display-val-sub">${subtotal.toFixed(2)}</span>
      </div>

      <div className="display-group" style={{ alignItems: 'center' }}>
        <span className="display-label">I.V.A (16%)</span>
        <span className="display-val-sub">${iva.toFixed(2)}</span>
      </div>

      <div className="display-group" style={{ alignItems: 'flex-end' }}>
        <span className="display-label">TOTAL PAGO</span>
        <span className="display-val-main">${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
