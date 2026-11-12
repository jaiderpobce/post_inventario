import { useState, useEffect, useCallback, useRef } from 'react';
import { CustomerModel } from '../models/CustomerModel';
import { ProductModel } from '../models/ProductModel';
import { SaleModel } from '../models/SaleModel';

export function usePosController() {
  const [customers, setCustomers] = useState(() => CustomerModel.getInitialCustomers());
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [activeCustomer, setActiveCustomer] = useState(() => customers[0] || null);

  const [cart, setCart] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Active quantity editing state
  const [editingQtyIndex, setEditingQtyIndex] = useState(null);
  const [editingQtyValue, setEditingQtyValue] = useState('');
  const [newRowCode, setNewRowCode] = useState('');

  // Refs for focusing
  const bottomInputRef = useRef(null);
  const qtyInputRef = useRef(null);

  // Modals
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', icon: '✨' });

  const showToast = useCallback((msg, icon = '✨') => {
    setToast({ show: true, message: msg, icon });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 2800);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products', { signal: abortController.signal });
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status} al consultar productos`);
        }

        const loadedProducts = await response.json();
        if (!Array.isArray(loadedProducts)) {
          throw new Error('La respuesta de productos no tiene el formato esperado');
        }

        setProducts(loadedProducts);
        setProductsError('');
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('No se pudieron cargar los productos desde la base de datos:', error);
        setProductsError('No se pudieron cargar los productos desde la base de datos.');
      } finally {
        if (!abortController.signal.aborted) {
          setProductsLoading(false);
        }
      }
    };

    loadProducts();
    return () => abortController.abort();
  }, []);

  // Sale Totals Calculation
  const totals = SaleModel.calculateSaleTotals(cart);

  // Add item to cart
  const handleAddToCart = useCallback((product) => {
    if (!product) return;

    const { cart: updatedCart, targetIndex } = SaleModel.addItemToCart(cart, product);
    setCart(updatedCart);
    setSelectedIndex(targetIndex);
    setEditingQtyIndex(targetIndex);
    setEditingQtyValue(String(updatedCart[targetIndex].qty));
    setIsCatalogOpen(false);

    showToast(`✅ Agregado: ${product.name}`);
  }, [cart, showToast]);

  // Update Item Quantity by Delta (+1, -1)
  const handleUpdateQty = useCallback((index, delta) => {
    setCart(prevCart => {
      if (!prevCart[index]) return prevCart;
      const newQty = prevCart[index].qty + delta;
      const updated = SaleModel.updateItemQuantity(prevCart, index, newQty);
      const nextIdx = index >= updated.length ? updated.length - 1 : index;
      setTimeout(() => setSelectedIndex(nextIdx), 0);
      return updated;
    });
  }, []);

  // Delete Cart Item
  const handleDeleteItem = useCallback((index) => {
    setCart(prevCart => {
      const updated = prevCart.filter((_, i) => i !== index);
      const nextIdx = index >= updated.length ? updated.length - 1 : index;
      setTimeout(() => setSelectedIndex(nextIdx), 0);
      return updated;
    });
    showToast('🗑️ Producto eliminado');
  }, [showToast]);

  // Clear Sale
  const handleClearSale = useCallback(() => {
    setCart([]);
    setSelectedIndex(-1);
    setEditingQtyIndex(null);
    setEditingQtyValue('');
  }, []);

  // Search product by barcode or name
  const handleQuickSearch = useCallback((query) => {
    if (productsLoading) {
      showToast('⏳ Cargando productos de la base de datos...');
      return;
    }
    if (productsError) {
      showToast(productsError, '⚠️');
      return;
    }

    const match = ProductModel.findProduct(products, query);
    if (match) {
      handleAddToCart(match);
    } else {
      showToast(`❌ Producto "${query}" no encontrado.`);
    }
  }, [products, productsLoading, productsError, handleAddToCart, showToast]);

  // Add custom prompt product
  const handleAddCustomProduct = useCallback(() => {
    const name = prompt('Nombre o descripción del producto:');
    if (!name) return;
    const priceStr = prompt('Precio unitario ($):', '15.00');
    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) return;

    const newProduct = ProductModel.createCustomProduct(name, price);
    handleAddToCart(newProduct);
  }, [handleAddToCart]);

  // Quantity editing submission
  const handleQtySubmit = useCallback((idx) => {
    const item = cart[idx];
    const parsedQty = Number(editingQtyValue);
    let newQty = ProductModel.isWeightBased(item)
      ? parsedQty
      : Math.trunc(parsedQty);

    if (!Number.isFinite(newQty) || newQty <= 0) {
      newQty = item?.qty || 1;
    }

    setCart(prevCart => {
      if (!prevCart[idx]) return prevCart;
      const currentQty = prevCart[idx].qty;
      const delta = newQty - currentQty;
      return delta !== 0 ? SaleModel.updateItemQuantity(prevCart, idx, newQty) : prevCart;
    });

    setEditingQtyIndex(null);
    setEditingQtyValue('');

    setTimeout(() => {
      if (bottomInputRef.current) {
        bottomInputRef.current.focus();
      }
    }, 20);
  }, [cart, editingQtyValue]);

  const handleQtyKeyDown = useCallback((e, idx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQtySubmit(idx);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingQtyIndex(null);
      if (bottomInputRef.current) bottomInputRef.current.focus();
    }
  }, [handleQtySubmit]);

  const startEditingQty = useCallback((idx) => {
    if (cart[idx]) {
      setEditingQtyIndex(idx);
      setEditingQtyValue(String(cart[idx].qty));
    }
  }, [cart]);

  // Customer actions
  const handleSelectCustomer = useCallback((cust) => {
    setActiveCustomer(cust);
    showToast(`👤 Cliente cargado: ${cust.name}`);
  }, [showToast]);

  const handleRegisterNewCustomer = useCallback(() => {
    const name = prompt('Nombre completo o Razón Social del nuevo cliente:');
    if (!name) return;
    const doc = prompt('Número de Documento (RIF / C.I):', 'V-00000000-0');
    const phone = prompt('Número de teléfono:', '0412-0000000');
    const email = prompt('Correo electrónico:', 'cliente@email.com');
    const address = prompt('Dirección fiscal corta:', 'Ciudad');

    const newCust = CustomerModel.createCustomer({ name, doc, phone, email, address });
    setCustomers(prev => [...prev, newCust]);
    setActiveCustomer(newCust);
    showToast(`👤 Cliente cargado: ${newCust.name}`);
  }, [showToast]);

  // Checkout payment confirmation
  const handleConfirmPayment = useCallback(({ method, total, paid, change }) => {
    setIsCheckoutOpen(false);
    alert(`🎉 ¡Factura emitida con éxito!\n\nFactura #002489\nCliente: ${activeCustomer.name} (${activeCustomer.doc})\nMétodo de Pago: ${method}\nTotal Facturado: $${total.toFixed(2)}\nCambio: $${change.toFixed(2)}`);
    handleClearSale();
  }, [activeCustomer, handleClearSale]);

  // F-Key Actions
  const triggerFKey = useCallback((key) => {
    switch (key) {
      case 'F1':
        setIsCustomerOpen(true);
        break;
      case 'F2':
        showToast('↩️ Módulo de Devoluciones listo');
        break;
      case 'F3':
        if (cart.length > 0) {
          if (window.confirm('¿Desea anular la venta actual?')) {
            handleClearSale();
            showToast('🚫 Venta anulada');
          }
        } else {
          showToast('⚠️ No hay productos en la venta actual');
        }
        break;
      case 'F4':
        if (selectedIndex >= 0 && selectedIndex < cart.length) {
          handleDeleteItem(selectedIndex);
        } else {
          showToast('⚠️ Seleccione un producto para eliminar');
        }
        break;
      case 'F5':
        if (selectedIndex >= 0 && selectedIndex < cart.length) {
          startEditingQty(selectedIndex);
        } else {
          showToast('⚠️ Seleccione una fila primero para cambiar la cantidad');
        }
        break;
      case 'F6':
        showToast('📂 Cargar factura borrador');
        break;
      case 'F7':
        if (cart.length > 0) {
          showToast('💾 Venta en borrador guardada con éxito');
        } else {
          showToast('⚠️ Agregue productos antes de guardar borrador');
        }
        break;
      case 'F8':
        if (cart.length > 0) {
          showToast('📋 Generando comprobante preliminar...');
        } else {
          showToast('⚠️ Venta vacía');
        }
        break;
      case 'F9':
        showToast('🖨️ Reimprimiendo último comprobante #002488...');
        break;
      case 'F10':
        if (cart.length === 0) {
          showToast('⚠️ Debe agregar productos antes de cobrar (F10)');
        } else {
          setIsCheckoutOpen(true);
        }
        break;
      case 'F11':
        setIsCatalogOpen(true);
        break;
      case 'F12':
        if (selectedIndex >= 0 && selectedIndex < cart.length) {
          const item = cart[selectedIndex];
          alert(`Detalles del Ítem:\n\nCódigo: ${item.code}\nDescripción: ${item.name}\nPrecio Unitario: $${item.price.toFixed(2)}\nCantidad: ${item.qty}\nSubtotal: $${(item.price * item.qty).toFixed(2)}`);
        } else {
          showToast('⚠️ Seleccione un producto para ver su detalle');
        }
        break;
      default:
        break;
    }
  }, [cart, selectedIndex, showToast, handleDeleteItem, handleClearSale, startEditingQty]);

  // Focus management effect
  useEffect(() => {
    if (editingQtyIndex !== null && qtyInputRef.current) {
      qtyInputRef.current.focus();
      qtyInputRef.current.select();
    } else if (editingQtyIndex === null && bottomInputRef.current) {
      bottomInputRef.current.focus();
    }
  }, [editingQtyIndex, cart, isCatalogOpen]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.startsWith('F') && e.key.length <= 3) {
        e.preventDefault();
        triggerFKey(e.key);
      } else if (e.key === 'Escape') {
        setIsCustomerOpen(false);
        setIsCheckoutOpen(false);
        setIsCatalogOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerFKey]);

  return {
    // Models / Data
    customers,
    products,
    productsLoading,
    productsError,
    activeCustomer,
    cart,
    selectedIndex,
    totals,
    editingQtyIndex,
    editingQtyValue,
    newRowCode,

    // Setters / Handlers
    setSelectedIndex,
    setNewRowCode,
    setEditingQtyValue,
    handleAddToCart,
    handleUpdateQty,
    handleDeleteItem,
    handleClearSale,
    handleQuickSearch,
    handleAddCustomProduct,
    handleQtySubmit,
    handleQtyKeyDown,
    startEditingQty,
    handleSelectCustomer,
    handleRegisterNewCustomer,
    handleConfirmPayment,
    triggerFKey,

    // Modals & Toast
    isCustomerOpen,
    setIsCustomerOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isCatalogOpen,
    setIsCatalogOpen,
    toast,
    showToast,

    // Refs
    bottomInputRef,
    qtyInputRef
  };
}
