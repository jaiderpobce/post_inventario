import React from 'react';
import { SaleModel } from '../../models/SaleModel';
import { ProductModel } from '../../models/ProductModel';

export default function CartItemRow({
  item,
  index,
  isSelected,
  isEditingQty,
  editingQtyValue,
  onSelectRow,
  onUpdateQty,
  onDeleteItem,
  onStartEditingQty,
  onChangeQtyValue,
  onQtyKeyDown,
  onQtySubmit,
  qtyInputRef
}) {
  const { rowTax = 0, total: rowTotal = 0 } = SaleModel.calculateRowTotals(item);
  const isWeightBased = ProductModel.isWeightBased(item);

  return (
    <tr 
      className={`${isSelected ? 'selected' : ''} ${isEditingQty ? 'editing-qty-row' : ''}`}
      onClick={() => onSelectRow(index)}
    >
      <td>{index + 1}</td>
      <td className="code-col">{item.code}</td>
      <td><strong>{item.name}</strong></td>
      
      <td style={{ textAlign: 'center' }}>
        {isEditingQty ? (
          <div className="qty-edit-wrapper">
            <input 
              ref={qtyInputRef}
              type="number" 
              min={isWeightBased ? '0.001' : '1'}
              step={isWeightBased ? '0.001' : '1'}
              aria-label={isWeightBased ? `Peso en kilogramos de ${item.name}` : `Cantidad de ${item.name}`}
              className="qty-active-input"
              value={editingQtyValue}
              onChange={onChangeQtyValue}
              onKeyDown={(e) => onQtyKeyDown(e, index)}
              onBlur={() => onQtySubmit(index)}
            />
            <span className="qty-enter-hint">⏎ Enter</span>
          </div>
        ) : (
          <div 
            className="qty-controls" 
            onClick={() => onStartEditingQty(index)} 
            title={isWeightBased ? 'Clic para modificar el peso en kilogramos' : 'Clic para modificar cantidad'}
          >
            <button 
              className="qty-btn" 
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQty(index, isWeightBased ? -0.1 : -1);
              }}
            >
              -
            </button>
            <span className="qty-val">
              {isWeightBased ? `${Number(item.qty).toFixed(3)} kg` : item.qty}
            </span>
            <button 
              className="qty-btn" 
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQty(index, isWeightBased ? 0.1 : 1);
              }}
            >
              +
            </button>
          </div>
        )}
      </td>

      <td className="price-col" style={{ textAlign: 'right' }}>
        ${item.price.toFixed(2)}{isWeightBased ? ' / kg' : ''}
      </td>
      <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        ${rowTax.toFixed(2)}
      </td>
      <td className="total-col" style={{ textAlign: 'right' }}>
        ${rowTotal.toFixed(2)}
      </td>
      <td style={{ textAlign: 'center' }}>
        <button 
          className="delete-btn" 
          onClick={(e) => {
            e.stopPropagation();
            onDeleteItem(index);
          }} 
          title="Eliminar"
        >
          🗑️
        </button>
      </td>
    </tr>
  );
}
