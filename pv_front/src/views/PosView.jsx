import React, { useState } from 'react';
import { usePosController } from '../controllers/usePosController';

import SidebarFKeys from '../components/common/SidebarFKeys';
import CustomerPanel from '../components/customer/CustomerPanel';
import TotalsDisplay from '../components/sale/TotalsDisplay';
import CartTable from '../components/sale/CartTable';
import FooterBar from '../components/common/FooterBar';

import CustomerModal from '../components/customer/CustomerModal';
import CheckoutModal from '../components/sale/CheckoutModal';
import CatalogModal from '../components/product/CatalogModal';
import Toast from '../components/common/Toast';

export default function PosView() {
  const controller = usePosController();
  const [topSearchValue, setTopSearchValue] = useState('');

  const handleTopSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = topSearchValue.trim();
      if (q) {
        controller.handleQuickSearch(q);
        setTopSearchValue('');
      }
    }
  };

  const handleBottomRowKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = controller.newRowCode.trim();
      if (q) {
        controller.handleQuickSearch(q);
        controller.setNewRowCode('');
      }
    }
  };

  return (
    <>
      <main className="app-container">
        <SidebarFKeys onTriggerFKey={controller.triggerFKey} />

        <section className="top-display-panel">
          <CustomerPanel 
            activeCustomer={controller.activeCustomer}
            onOpenCustomerModal={() => controller.setIsCustomerOpen(true)}
          />
          <TotalsDisplay 
            subtotal={controller.totals.subtotal}
            iva={controller.totals.iva}
            total={controller.totals.total}
          />
        </section>

        <section className="main-workspace">
          <div className="search-bar-container">
            <div className="search-input-wrapper">
              <span>🔍</span>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Escriba el nombre, código de barras o presione F11 para buscar (ej: 001, Coca Cola, Agua)..." 
                autoComplete="off"
                value={topSearchValue}
                onChange={(e) => setTopSearchValue(e.target.value)}
                onKeyDown={handleTopSearchKeyDown}
              />
            </div>
            <button className="btn-quick-add" onClick={controller.handleAddCustomProduct}>
              ＋ Agregar Ítem
            </button>
          </div>

          <CartTable 
            cart={controller.cart}
            selectedIndex={controller.selectedIndex}
            editingQtyIndex={controller.editingQtyIndex}
            editingQtyValue={controller.editingQtyValue}
            newRowCode={controller.newRowCode}
            onSelectRow={controller.setSelectedIndex}
            onUpdateQty={controller.handleUpdateQty}
            onDeleteItem={controller.handleDeleteItem}
            onStartEditingQty={controller.startEditingQty}
            onChangeQtyValue={(e) => controller.setEditingQtyValue(e.target.value)}
            onQtyKeyDown={controller.handleQtyKeyDown}
            onQtySubmit={controller.handleQtySubmit}
            onChangeNewRowCode={(e) => controller.setNewRowCode(e.target.value)}
            onBottomRowKeyDown={handleBottomRowKeyDown}
            bottomInputRef={controller.bottomInputRef}
            qtyInputRef={controller.qtyInputRef}
          />
        </section>

        <FooterBar 
          lineCount={controller.totals.lineCount}
          itemTotalCount={controller.totals.itemTotalCount}
        />
      </main>

      <CustomerModal 
        isOpen={controller.isCustomerOpen}
        onClose={() => controller.setIsCustomerOpen(false)}
        customers={controller.customers}
        onSelectCustomer={controller.handleSelectCustomer}
        onRegisterNewCustomer={controller.handleRegisterNewCustomer}
      />

      <CheckoutModal 
        isOpen={controller.isCheckoutOpen}
        onClose={() => controller.setIsCheckoutOpen(false)}
        cart={controller.cart}
        activeCustomer={controller.activeCustomer}
        onConfirmPayment={controller.handleConfirmPayment}
      />

      <CatalogModal 
        isOpen={controller.isCatalogOpen}
        onClose={() => controller.setIsCatalogOpen(false)}
        products={controller.products}
        isLoading={controller.productsLoading}
        error={controller.productsError}
        onAddToCart={controller.handleAddToCart}
      />

      <Toast toastState={controller.toast} />
    </>
  );
}
