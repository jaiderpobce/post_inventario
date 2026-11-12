import React from 'react';

export default function BarcodeScannerRow({ 
  rowNumber, 
  value, 
  onChange, 
  onKeyDown, 
  inputRef 
}) {
  return (
    <tr className="table-input-row" onClick={() => inputRef.current?.focus()}>
      <td style={{ fontWeight: 800, color: 'var(--google-blue)' }}>{rowNumber}</td>
      <td>
        <input 
          ref={inputRef}
          type="text" 
          className="active-row-input" 
          placeholder="Escanee código..." 
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
      </td>
      <td>
        <span className="waiting-text">
          ⚡ Listo para escanear lector de código de barras...
        </span>
      </td>
      <td style={{ textAlign: 'center' }}>
        <span className="qty-val" style={{ opacity: 0.5 }}>1</span>
      </td>
      <td style={{ textAlign: 'right', opacity: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>$0.00</td>
      <td style={{ textAlign: 'right', opacity: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>$0.00</td>
      <td style={{ textAlign: 'right', opacity: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>$0.00</td>
      <td style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--google-blue)', fontWeight: 800 }}>⏎</span>
      </td>
    </tr>
  );
}
