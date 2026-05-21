import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  menu_id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">) => void;
  remove: (menu_id: string) => void;
  setQty: (menu_id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => set((s) => {
        const existing = s.items.find((i) => i.menu_id === item.menu_id);
        if (existing) {
          return { items: s.items.map((i) => i.menu_id === item.menu_id ? { ...i, quantity: i.quantity + 1 } : i) };
        }
        return { items: [...s.items, { ...item, quantity: 1 }] };
      }),
      remove: (menu_id) => set((s) => ({ items: s.items.filter((i) => i.menu_id !== menu_id) })),
      setQty: (menu_id, qty) => set((s) => ({
        items: qty <= 0
          ? s.items.filter((i) => i.menu_id !== menu_id)
          : s.items.map((i) => i.menu_id === menu_id ? { ...i, quantity: qty } : i),
      })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
      count: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
    }),
    { name: "wmk-cart" }
  )
);
