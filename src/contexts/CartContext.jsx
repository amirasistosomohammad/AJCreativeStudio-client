import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isCustomerAuthenticated, customerToken } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart_items');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncTimeoutRef = useRef(null);
  const hasLoadedFromBackendRef = useRef(false);
  const hasMergedGuestCartRef = useRef(false);
  const prevAuthStateRef = useRef(isCustomerAuthenticated);
  const prevCustomerTokenRef = useRef(customerToken);
  const pendingOperationsRef = useRef(new Map()); // Track pending operations by productId
  const operationCounterRef = useRef(0); // Track operation sequence

  const apiBaseUrl = import.meta.env.VITE_LARAVEL_API || import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Load cart from backend when customer is authenticated - SIMPLE VERSION
  useEffect(() => {
    const loadCartFromBackend = async () => {
      // Skip if on order confirmation page
      try {
        if (typeof window !== 'undefined') {
          const path = window.location.pathname || '';
          if (path.startsWith('/order/')) {
            return;
          }
        }
      } catch (e) {
        // Ignore
      }

      // Skip if there are pending operations (don't reload while user is modifying cart)
      if (pendingOperationsRef.current.size > 0) {
        return;
      }

      // Get token - check localStorage first (most reliable)
      const tokenFromStorage = typeof window !== 'undefined' ? localStorage.getItem('customer_token') : null;
      const effectiveToken = customerToken || tokenFromStorage;
      
      // SIMPLE CHECK: If authenticated + has token + haven't loaded = LOAD IT
      if (!isCustomerAuthenticated || !effectiveToken) {
        return;
      }
      
      // If already loaded in this session, skip (unless token changed)
      const tokenChanged = prevCustomerTokenRef.current !== effectiveToken;
      if (hasLoadedFromBackendRef.current && !tokenChanged) {
        return;
      }
      
      // Token changed or first load - reset flags and load
      if (tokenChanged) {
        console.log('🔄 Token changed - reloading cart');
        hasLoadedFromBackendRef.current = false;
        hasMergedGuestCartRef.current = false;
      }
      
      prevCustomerTokenRef.current = effectiveToken;
      
      console.log('🔄 LOADING CART FROM BACKEND...');

      try {
        setIsLoadingCart(true);
        
        // Check if there's a guest cart to merge (only once, on first login)
        const guestCart = localStorage.getItem('cart_items');
        let guestItems = [];
        let shouldMergeGuestCart = false;
        
        if (guestCart && !hasMergedGuestCartRef.current) {
          try {
            guestItems = JSON.parse(guestCart);
            shouldMergeGuestCart = guestItems.length > 0;
          } catch (e) {
            console.error('Error parsing guest cart:', e);
          }
        }

        // Load cart from backend
        const response = await fetch(`${apiBaseUrl}${apiBaseUrl.includes('/api') ? '' : '/api'}/cart`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${effectiveToken}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Backend cart API response:', data);
          
          if (data.success) {
            const backendCart = data.cart || [];
            console.log('Backend cart array:', backendCart);
            
            // If there's a guest cart to merge (first time only), merge it
            if (shouldMergeGuestCart && !hasMergedGuestCartRef.current) {
              // Merge guest cart with backend cart (backend will handle the merge logic)
              await mergeGuestCart(guestItems);
              hasMergedGuestCartRef.current = true;
              // Clear guest cart from localStorage after merge
              localStorage.removeItem('cart_items');
            } else {
              // No merge needed, just load backend cart
              console.log('📦 Backend cart loaded:', backendCart.length, 'items');
              
              // ALWAYS update state and localStorage - NO EXCEPTIONS
              setCartItems(backendCart);
              
              // FORCE SAVE to localStorage - ALWAYS
              if (backendCart.length === 0) {
                localStorage.removeItem('cart_items');
                console.log('✅ Cart empty - removed from localStorage');
              } else {
                const cartJson = JSON.stringify(backendCart);
                localStorage.setItem('cart_items', cartJson);
                
                // Verify immediately
                const saved = localStorage.getItem('cart_items');
                if (saved) {
                  console.log('✅✅✅ CART SAVED TO LOCALSTORAGE! Items:', JSON.parse(saved).length);
                } else {
                  console.error('❌ FAILED TO SAVE TO LOCALSTORAGE!');
                  // Retry once
                  localStorage.setItem('cart_items', cartJson);
                  console.log('🔄 Retried save');
                }
              }
              
              hasLoadedFromBackendRef.current = true;
            }
          } else {
            console.error('Backend cart API returned success=false:', data);
          }
        } else {
          console.error('Backend cart API failed:', response.status, response.statusText);
          const errorData = await response.json().catch(() => ({}));
          console.error('Error response:', errorData);
          
          // If backend fails, keep guest cart if available (fallback)
          // But don't merge, just use guest cart as-is
          if (guestItems.length > 0) {
            console.log('Using guest cart as fallback:', guestItems);
            setCartItems(guestItems);
          }
        }
      } catch (error) {
        console.error('Error loading cart from backend:', error);
        // Fallback to localStorage if backend fails
      } finally {
        setIsLoadingCart(false);
      }
    };

    loadCartFromBackend();
  }, [isCustomerAuthenticated, customerToken]);

  // Reset flags and clear cart when customer logs out (similar to token clearing)
  useEffect(() => {
    // Only clear cart if transitioning from authenticated to non-authenticated (actual logout)
    if (prevAuthStateRef.current === true && isCustomerAuthenticated === false) {
      hasLoadedFromBackendRef.current = false;
      hasMergedGuestCartRef.current = false;
      
      // Clear cart from state and localStorage when customer logs out
      setCartItems([]);
      try {
        localStorage.removeItem('cart_items');
      } catch (error) {
        console.error('Error clearing cart on logout:', error);
      }
    }
    // Update previous auth state
    prevAuthStateRef.current = isCustomerAuthenticated;
  }, [isCustomerAuthenticated]);
  
  // Load cart from localStorage when user is not authenticated (guest mode)
  // This only applies to new guest sessions, not after logout
  useEffect(() => {
    // Only load from localStorage if user is not authenticated, we haven't loaded from backend,
    // and this is not a logout transition (prevAuthStateRef would be false initially)
    if (!isCustomerAuthenticated && !hasLoadedFromBackendRef.current && prevAuthStateRef.current === false) {
      try {
        const savedCart = localStorage.getItem('cart_items');
        if (savedCart) {
          const guestCart = JSON.parse(savedCart);
          setCartItems(guestCart);
        } else {
          // No saved cart, clear state
          setCartItems([]);
        }
      } catch (error) {
        console.error('Error loading guest cart:', error);
        setCartItems([]);
      }
    }
  }, [isCustomerAuthenticated]);

  // Merge guest cart with backend cart (only called once on first login)
  const mergeGuestCart = async (guestItems) => {
    if (!isCustomerAuthenticated || !customerToken || hasMergedGuestCartRef.current) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}${apiBaseUrl.includes('/api') ? '' : '/api'}/cart/merge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${customerToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ items: guestItems }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.cart) {
          // Update local state from merged cart
          setCartItems(data.cart);
          if (data.cart.length === 0) {
            localStorage.removeItem('cart_items');
          } else {
            localStorage.setItem('cart_items', JSON.stringify(data.cart));
          }
          hasLoadedFromBackendRef.current = true;
          hasMergedGuestCartRef.current = true;
        }
      }
    } catch (error) {
      console.error('Error merging guest cart:', error);
    }
  };

  // Note: Removed auto-sync function - all syncs now happen explicitly in add/remove/update methods
  // This prevents race conditions and ensures backend is always the source of truth

  // Save cart to localStorage whenever it changes (but don't auto-sync to backend)
  // Backend sync happens explicitly in addToCart, removeFromCart, updateQuantity, etc.
  useEffect(() => {
    try {
      if (cartItems.length === 0) {
        localStorage.removeItem('cart_items');
      } else {
        localStorage.setItem('cart_items', JSON.stringify(cartItems));
      }
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, [cartItems]);

  const addToCart = async (product) => {
    // OPTIMISTIC UPDATE: Update UI immediately for instant response
    // Convert both IDs to strings for reliable comparison (handles string/number mismatch)
    const productId = String(product.id);
    const existingItemIndex = cartItems.findIndex(item => String(item.id) === productId);
    
    let updatedCart;
    if (existingItemIndex >= 0) {
      // Item exists - increment quantity
      updatedCart = [...cartItems];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: (updatedCart[existingItemIndex].quantity || 1) + 1
      };
    } else {
      // New item - add to cart
      updatedCart = [...cartItems, { ...product, quantity: 1 }];
    }
    
    setCartItems(updatedCart);
    localStorage.setItem('cart_items', JSON.stringify(updatedCart));

    // If authenticated, sync with backend in background (non-blocking)
    if (isCustomerAuthenticated && customerToken) {
      // Use setTimeout to make it non-blocking
      setTimeout(async () => {
        try {
          const response = await fetch(`${apiBaseUrl}${apiBaseUrl.includes('/api') ? '' : '/api'}/cart/add`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${customerToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              product_id: parseInt(product.id),
              quantity: 1,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.cart) {
              // Update local state from backend response (source of truth)
              // Use functional update to prevent overwriting correct optimistic updates
              setCartItems((currentCart) => {
                // Check if backend cart matches current optimistic state
                // If they match, keep current state to prevent flickering
                const currentItem = currentCart.find(item => String(item.id) === productId);
                const backendItem = data.cart.find(item => String(item.id) === productId);
                
                // If both have the item with same quantity, keep current state
                if (currentItem && backendItem && currentItem.quantity === backendItem.quantity) {
                  // Quantities match - optimistic update was correct, keep it
                  return currentCart;
                }
                
                // Backend has different state - use it as source of truth
                return data.cart;
              });
              // Always update localStorage with backend response
              localStorage.setItem('cart_items', JSON.stringify(data.cart));
            }
          }
        } catch (error) {
          console.error('Error adding to cart in backend:', error);
        }
      }, 0);
    }
  };

  const removeFromCart = async (productId) => {
    // OPTIMISTIC UPDATE: Update UI immediately for instant response
    const updatedCart = cartItems.filter(item => item.id !== productId);
    setCartItems(updatedCart);
    if (updatedCart.length === 0) {
      localStorage.removeItem('cart_items');
    } else {
      localStorage.setItem('cart_items', JSON.stringify(updatedCart));
    }

    // If authenticated, sync with backend in background (non-blocking)
    if (isCustomerAuthenticated && customerToken) {
      // Cancel any pending operation for this product (in case of rapid clicks)
      const pendingOp = pendingOperationsRef.current.get(`remove_${productId}`);
      if (pendingOp) {
        if (pendingOp.timeoutId) {
          clearTimeout(pendingOp.timeoutId);
        }
        if (pendingOp.abortController) {
          pendingOp.abortController.abort();
        }
      }

      // Increment operation counter
      operationCounterRef.current += 1;
      const currentOpId = operationCounterRef.current;
      const abortController = new AbortController();

      // Use setTimeout to make it non-blocking
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`${apiBaseUrl}${apiBaseUrl.includes('/api') ? '' : '/api'}/cart/remove/${productId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${customerToken}`,
              'Accept': 'application/json',
            },
            signal: abortController.signal,
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // Only update if this is still the latest operation
              const latestOp = pendingOperationsRef.current.get(`remove_${productId}`);
              if (latestOp && latestOp.opId === currentOpId) {
                // Get current state to verify item is still removed
                setCartItems((currentCart) => {
                  const itemStillExists = currentCart.some(item => item.id === productId);
                  const backendCart = data.cart || [];
                  const backendItemExists = backendCart.some(item => item.id === productId);
                  
                  // If item was successfully removed from backend, use backend cart
                  // This ensures consistency even if optimistic update was somehow reverted
                  if (!backendItemExists) {
                    // Backend confirms item is removed - use backend as source of truth
                    if (backendCart.length === 0) {
                      localStorage.removeItem('cart_items');
                    } else {
                      localStorage.setItem('cart_items', JSON.stringify(backendCart));
                    }
                    return backendCart;
                  }
                  
                  // If backend still has the item (shouldn't happen), keep current optimistic state
                  // This prevents the item from reappearing if backend response is stale
                  if (!itemStillExists) {
                    // Item is removed in optimistic state - keep it removed
                    return currentCart;
                  }
                  
                  // Item exists in both - something went wrong, but prefer backend
                  return backendCart;
                });
              }
            }
          }
          
          // Remove this operation from pending
          const stillPending = pendingOperationsRef.current.get(`remove_${productId}`);
          if (stillPending && stillPending.opId === currentOpId) {
            pendingOperationsRef.current.delete(`remove_${productId}`);
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error removing from cart in backend:', error);
          }
          // Remove this operation from pending
          const stillPending = pendingOperationsRef.current.get(`remove_${productId}`);
          if (stillPending && stillPending.opId === currentOpId) {
            pendingOperationsRef.current.delete(`remove_${productId}`);
          }
        }
      }, 0);

      // Store pending operation
      pendingOperationsRef.current.set(`remove_${productId}`, {
        opId: currentOpId,
        timeoutId: timeoutId,
        abortController: abortController,
      });
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // OPTIMISTIC UPDATE: Update UI immediately for instant response
    const updatedCart = cartItems.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    setCartItems(updatedCart);
    if (updatedCart.length === 0) {
      localStorage.removeItem('cart_items');
    } else {
      localStorage.setItem('cart_items', JSON.stringify(updatedCart));
    }

    // If authenticated, sync with backend in background (non-blocking)
    if (isCustomerAuthenticated && customerToken) {
      // Cancel any pending operation for this product
      const pendingOp = pendingOperationsRef.current.get(productId);
      if (pendingOp) {
        if (pendingOp.timeoutId) {
          clearTimeout(pendingOp.timeoutId);
        }
        if (pendingOp.abortController) {
          pendingOp.abortController.abort();
        }
      }

      // Increment operation counter for this request
      operationCounterRef.current += 1;
      const currentOpId = operationCounterRef.current;
      const expectedQuantity = quantity;
      const abortController = new AbortController();

      // Debounce backend sync to batch rapid clicks
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`${apiBaseUrl}${apiBaseUrl.includes('/api') ? '' : '/api'}/cart/update/${productId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${customerToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ quantity: expectedQuantity }),
            signal: abortController.signal,
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.cart) {
              // Only update if this is still the latest operation for this product
              const latestOp = pendingOperationsRef.current.get(productId);
              if (latestOp && latestOp.opId === currentOpId) {
                // Get current optimistic state
                setCartItems((currentCart) => {
                  const currentItem = currentCart.find(item => item.id === productId);
                  const currentOptimisticQty = currentItem ? currentItem.quantity : expectedQuantity;
                  
                  // Backend response
                  const backendItem = data.cart.find(item => item.id === productId);
                  
                  // Only update from backend if:
                  // 1. Backend quantity matches what we expected (normal case)
                  // 2. OR current optimistic quantity still matches expected (no newer clicks happened)
                  if (backendItem && 
                      (backendItem.quantity === expectedQuantity || 
                       currentOptimisticQty === expectedQuantity)) {
                    // Backend is source of truth
                    if (data.cart.length === 0) {
                      localStorage.removeItem('cart_items');
                    } else {
                      localStorage.setItem('cart_items', JSON.stringify(data.cart));
                    }
                    return data.cart;
                  }
                  
                  // Keep current optimistic state (newer clicks happened)
                  return currentCart;
                });
              }
            }
          }
          
          // Remove this operation from pending
          const stillPending = pendingOperationsRef.current.get(productId);
          if (stillPending && stillPending.opId === currentOpId) {
            pendingOperationsRef.current.delete(productId);
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error updating cart quantity in backend:', error);
          }
          // Remove this operation from pending
          const stillPending = pendingOperationsRef.current.get(productId);
          if (stillPending && stillPending.opId === currentOpId) {
            pendingOperationsRef.current.delete(productId);
          }
        }
      }, 200); // 200ms debounce to batch rapid clicks

      // Store pending operation
      pendingOperationsRef.current.set(productId, {
        opId: currentOpId,
        quantity: expectedQuantity,
        timeoutId: timeoutId,
        abortController: abortController,
      });
    }
  };

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const clearCart = async () => {
    setCartItems([]);
    localStorage.removeItem('cart_items');

    // Clear backend cart too (use token from context or localStorage so it works
    // even if AuthContext hasn't finished updating yet after PayMaya redirect)
    try {
      const tokenFromContext = customerToken;
      const tokenFromStorage =
        typeof window !== 'undefined'
          ? localStorage.getItem('customer_token')
          : null;
      const authToken = tokenFromContext || tokenFromStorage;

      if (authToken) {
        await fetch(
          `${apiBaseUrl}${apiBaseUrl.includes('/api') ? '' : '/api'}/cart/clear`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept: 'application/json',
            },
          },
        );
      }
    } catch (error) {
      console.error('Error clearing cart in backend:', error);
      // Continue with local state if sync fails
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartOpen,
        setCartOpen,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartItemCount,
        getCartTotal,
        clearCart,
        isLoadingCart,
        isSyncing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
