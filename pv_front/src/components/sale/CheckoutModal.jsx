import React, { useState, useEffect } from 'react';
import { SaleModel } from '../../models/SaleModel';

export default function CheckoutModal({ isOpen, onClose, cart, activeCustomer, onConfirmPayment }) {
  const [selectedMethod, setSelectedMethod] = useState('EFECTIVO');
  const [paidAmount, setPaidAmount] = useState('');

  const { total } = SaleModel.calculateSaleTotals(cart);

  useEffect(() => {
    if (isOpen) {
      setPaidAmount(total.toFixed(2));
      setSelectedMethod('EFECTIVO');
    }
  }, [isOpen, total]);

  if (!isOpen) return null;

  const paidNum = parseFloat(paidAmount) || 0;
  const change = paidNum - total;
  const isSufficient = change >= 0;

  const handleConfirm = () => {
    if (!isSufficient) {
      alert('El monto ingresado es menor al total a pagar.');
      return;
    }
    onConfirmPayment({
      method: selectedMethod,
      total: total,
      paid: paidNum,
      change: change
    });
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>💳 Totalizar Venta — Facturación</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* RESUMEN DEL CLIENTE DE FACTURACIÓN */}
        <div className="checkout-customer-summary">
          <h4>
            <span>{activeCustomer?.name || 'Cliente Genérico'}</span>{' '}
            <span style={{ fontSize: '0.72rem', color: 'var(--google-green)' }}>
              {activeCustomer?.type || 'Consumidor Final'}
            </span>
          </h4>
          <p>
            <strong>RIF/CI:</strong> <span>{activeCustomer?.doc || 'Sin Documento'}</span> | <strong>Teléfono:</strong> <span>{activeCustomer?.phone || 'Sin Teléfono'}</span>
          </p>
          <p>
            <strong>Dirección:</strong> <span>{activeCustomer?.address || 'Sin Dirección Registrada'}</span>
          </p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px', padding: '14px', background: 'rgba(24, 128, 56, 0.08)', borderRadius: '14px', border: '1px solid rgba(24, 128, 56, 0.25)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>MONTO TOTAL A COBRAR</span>
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '2.2rem', fontWeight: 900, color: 'var(--google-green)' }}>
            ${total.toFixed(2)}
          </span>
        </div>

        <div className="form-group">
          <label>Método de Pago</label>
          <div className="payment-methods">
            <button 
              className={`pm-btn ${selectedMethod === 'EFECTIVO' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('EFECTIVO')}
            >
              💵 Efectivo
            </button>
            <button 
              className={`pm-btn ${selectedMethod === 'TARJETA' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('TARJETA')}
            >
              💳 Tarjeta / POS
            </button>
            <button 
              className={`pm-btn ${selectedMethod === 'PAGO_MOVIL' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('PAGO_MOVIL')}
            >
              📱 Pago Móvil
            </button>
            <button 
              className={`pm-btn ${selectedMethod === 'TRANSFERENCIA' ? 'active' : ''}`}
              onClick={() => setSelectedMethod('TRANSFERENCIA')}
            >
              🏦 Transferencia
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Monto Recibido ($)</label>
          <input 
            type="number" 
            className="form-control" 
            placeholder="0.00" 
            step="0.01" 
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Vuelto / Cambio Estimado ($)</label>
          <input 
            type="text" 
            className="form-control" 
            value={isSufficient ? `$${change.toFixed(2)}` : `Faltan $${Math.abs(change).toFixed(2)}`}
            readOnly 
            style={{ color: isSufficient ? 'var(--google-green)' : 'var(--google-red)', fontWeight: 900 }}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-modal secondary" onClick={onClose}>Cancelar (Esc)</button>
          <button className="btn-modal primary" onClick={handleConfirm}>Confirmar Factura (Enter)</button>
        </div>
      </div>
    </div>
  );
}
