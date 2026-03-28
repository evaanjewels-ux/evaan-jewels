"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { ICartItem } from "@/types";

// ─── State ───────────────────────────────────────────

interface CartState {
  items: ICartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: ICartItem }
  | { type: "REMOVE_ITEM"; payload: string }  // cartItemId
  | { type: "UPDATE_QUANTITY"; payload: { cartItemId: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART" }
  | { type: "SET_CART_OPEN"; payload: boolean }
  | { type: "LOAD_CART"; payload: ICartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (i) => i.cartItemId === action.payload.cartItemId
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.cartItemId === action.payload.cartItemId
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((i) => i.cartItemId !== action.payload),
      };
    case "UPDATE_QUANTITY":
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (i) => i.cartItemId !== action.payload.cartItemId
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.cartItemId === action.payload.cartItemId
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    case "CLEAR_CART":
      return { ...state, items: [] };
    case "TOGGLE_CART":
      return { ...state, isOpen: !state.isOpen };
    case "SET_CART_OPEN":
      return { ...state, isOpen: action.payload };
    case "LOAD_CART":
      // Backfill cartItemId for legacy items loaded from localStorage
      return {
        ...state,
        items: action.payload.map((item) => ({
          ...item,
          cartItemId: item.cartItemId ?? `${item.productId}||`,
        })),
      };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────

interface CartContextType {
  items: ICartItem[];
  isOpen: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (item: ICartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = "evaan-jewels-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: "LOAD_CART", payload: parsed });
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Persist cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Ignore storage errors
    }
  }, [state.items]);

  const addItem = useCallback((item: ICartItem) => {
    dispatch({ type: "ADD_ITEM", payload: item });
    toast.success(`${item.name} added to cart`);
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: cartItemId });
    toast.info("Item removed from cart");
  }, []);

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      dispatch({ type: "UPDATE_QUANTITY", payload: { cartItemId, quantity } });
    },
    []
  );

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const toggleCart = useCallback(() => {
    dispatch({ type: "TOGGLE_CART" });
  }, []);

  const setCartOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET_CART_OPEN", payload: open });
  }, []);

  const itemCount = state.items.reduce((sum: number, i: ICartItem) => sum + i.quantity, 0);
  const subtotal = state.items.reduce(
    (sum: number, i: ICartItem) => sum + Math.floor(i.totalPrice / 10) * 10 * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen: state.isOpen,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        setCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
