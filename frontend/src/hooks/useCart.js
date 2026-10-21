import { useState, useEffect, useCallback } from 'react';

const CART_STORAGE_KEY = 'cloudmart_cart';
const CART_EVENT_NAME = 'cloudmart-cart-updated';

function getStoredCart() {
  try {
    const data = localStorage.getItem(CART_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error reading cart from localStorage:', err);
    return [];
  }
}

export const useCart = () => {
  const [items, setItems] = useState(getStoredCart);

  // Sync state with storage changes from other tabs or components
  useEffect(() => {
    const handleCartSync = () => {
      setItems(getStoredCart());
    };

    window.addEventListener(CART_EVENT_NAME, handleCartSync);
    window.addEventListener('storage', handleCartSync);

    return () => {
      window.removeEventListener(CART_EVENT_NAME, handleCartSync);
      window.removeEventListener('storage', handleCartSync);
    };
  }, []);

  const saveCart = useCallback((updatedItems) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedItems));
      setItems(updatedItems);
      window.dispatchEvent(new Event(CART_EVENT_NAME));
    } catch (err) {
      console.error('Error saving cart to localStorage:', err);
    }
  }, []);

  /**
   * Add a product to the cart or increment its quantity
   * @param {{ id: number, name: string, price: number, image_url?: string }} product
   * @param {number} quantity
   */
  const addItem = useCallback((product, quantity = 1) => {
    if (!product || !product.id || quantity <= 0) return;

    const currentItems = getStoredCart();
    const existingIndex = currentItems.findIndex((item) => item.productId === product.id);

    let newItems;
    if (existingIndex > -1) {
      newItems = currentItems.map((item, index) => {
        if (index === existingIndex) {
          return {
            ...item,
            quantity: item.quantity + quantity,
          };
        }
        return item;
      });
    } else {
      newItems = [
        ...currentItems,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          quantity: quantity,
          imageUrl: product.image_url || '',
        },
      ];
    }

    saveCart(newItems);
  }, [saveCart]);

  /**
   * Update quantity of a product in the cart. If quantity <= 0, remove the item.
   * @param {number} productId
   * @param {number} quantity
   */
  const updateQuantity = useCallback((productId, quantity) => {
    const currentItems = getStoredCart();
    const parsedQty = parseInt(quantity, 10);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      const filtered = currentItems.filter((item) => item.productId !== productId);
      saveCart(filtered);
    } else {
      const newItems = currentItems.map((item) => {
        if (item.productId === productId) {
          return { ...item, quantity: parsedQty };
        }
        return item;
      });
      saveCart(newItems);
    }
  }, [saveCart]);

  /**
   * Remove a product from the cart completely
   * @param {number} productId
   */
  const removeItem = useCallback((productId) => {
    const currentItems = getStoredCart();
    const filtered = currentItems.filter((item) => item.productId !== productId);
    saveCart(filtered);
  }, [saveCart]);

  /**
   * Clear the entire cart
   */
  const clearCart = useCallback(() => {
    saveCart([]);
  }, [saveCart]);

  /**
   * Check how many of a specific item are already in the cart
   */
  const getItemQuantity = useCallback((productId) => {
    const found = items.find((item) => item.productId === productId);
    return found ? found.quantity : 0;
  }, [items]);

  // Aggregate metrics
  const itemCount = items.reduce((total, item) => total + (item.quantity || 0), 0);
  const subtotal = items.reduce((total, item) => total + (Number(item.price) || 0) * (item.quantity || 0), 0);

  return {
    items,
    itemCount,
    subtotal: Number(subtotal.toFixed(2)),
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemQuantity,
  };
};
