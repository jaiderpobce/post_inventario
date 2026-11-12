import React, { useRef, useEffect } from 'react';
import CartItemRow from './CartItemRow';
import BarcodeScannerRow from '../product/BarcodeScannerRow';

export default function CartTable({
  cart,
  selectedIndex,
  editingQtyIndex,
  editingQtyValue,
  newRowCode,
  onSelectRow,
  onUpdateQty,
  onDeleteItem,
  onStartEditingQty,
  onChangeQtyValue,
  onQtyKeyDown,
  onQtySubmit,
  onChangeNewRowCode,
  onBottomRowKeyDown,
  bottomInputRef,
  qtyInputRef
}) {
  const tableContainerRef = useRef(null);

  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
    }
  }, [cart.length]);

  return (
    <div className="table-container" ref={tableContainerRef}>
      <table className="pos-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>#</th>
            <th style={{ width: '150px' }}>Código</th>
            <th>Descripción</th>
            <th style={{ width: '140px', textAlign: 'center' }}>Cantidad / peso</th>
            <th style={{ width: '120px', textAlign: 'right' }}>Precio Unit.</th>
            <th style={{ width: '100px', textAlign: 'right' }}>IVA</th>
            <th style={{ width: '130px', textAlign: 'right' }}>Total</th>
            <th style={{ width: '50px', textAlign: 'center' }}></th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, idx) => (
            <CartItemRow 
              key={`${item.id}-${idx}`}
              item={item}
              index={idx}
              isSelected={idx === selectedIndex}
              isEditingQty={editingQtyIndex === idx}
              editingQtyValue={editingQtyValue}
              onSelectRow={onSelectRow}
              onUpdateQty={onUpdateQty}
              onDeleteItem={onDeleteItem}
              onStartEditingQty={onStartEditingQty}
              onChangeQtyValue={onChangeQtyValue}
              onQtyKeyDown={onQtyKeyDown}
              onQtySubmit={onQtySubmit}
              qtyInputRef={qtyInputRef}
            />
          ))}

          <BarcodeScannerRow 
            rowNumber={cart.length + 1}
            value={newRowCode}
            onChange={onChangeNewRowCode}
            onKeyDown={onBottomRowKeyDown}
            inputRef={bottomInputRef}
          />
        </tbody>
      </table>

      {cart.length === 0 && (
        <div className="empty-state" style={{ paddingTop: '30px', paddingBottom: '30px' }}>
          <div className="empty-icon">🛒</div>
          <h3>Ticket de Venta Vacío</h3>
          <p>
            Escanee un código en la fila activa de abajo o busque productos con{' '}
            <kbd style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid #dadce0', padding: '2px 6px', borderRadius: '4px' }}>
              F11
            </kbd>
          </p>
        </div>
      )}
    </div>
  );
}
