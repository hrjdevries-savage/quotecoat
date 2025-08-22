import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QuoteDraft, LineItem, Attachment, QuoteMeta } from '@/types';

interface QuoteStore {
  currentDraft: QuoteDraft | null;
  setDraft: (draft: QuoteDraft) => void;
  addLineItem: (lineItem: LineItem) => void;
  updateLineItem: (id: string, updates: Partial<LineItem>) => void;
  removeLineItem: (id: string) => void;
  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (id: string) => void;
  updateMeta: (meta: Partial<QuoteMeta>) => void;
  clearDraft: () => void;
  getTotalPrice: () => number;
  generateQuoteNumber: () => string;
}

const generateQuoteNumber = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.getHours().toString().padStart(2, '0') + 
                  now.getMinutes().toString().padStart(2, '0');
  return `${dateStr}-${timeStr}`;
};

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      currentDraft: null,

      setDraft: (draft) => set({ currentDraft: draft }),

      addLineItem: (lineItem) =>
        set((state) => ({
          currentDraft: state.currentDraft
            ? {
                ...state.currentDraft,
                lineItems: [...state.currentDraft.lineItems, lineItem],
              }
            : null,
        })),

      updateLineItem: (id, updates) =>
        set((state) => ({
          currentDraft: state.currentDraft
            ? {
                ...state.currentDraft,
                lineItems: state.currentDraft.lineItems.map((item) =>
                  item.id === id ? { ...item, ...updates } : item
                ),
              }
            : null,
        })),

      removeLineItem: (id) =>
        set((state) => ({
          currentDraft: state.currentDraft
            ? {
                ...state.currentDraft,
                lineItems: state.currentDraft.lineItems.filter(
                  (item) => item.id !== id
                ),
              }
            : null,
        })),

      addAttachment: (attachment) =>
        set((state) => ({
          currentDraft: state.currentDraft
            ? {
                ...state.currentDraft,
                attachments: [...state.currentDraft.attachments, attachment],
              }
            : null,
        })),

      removeAttachment: (id) =>
        set((state) => ({
          currentDraft: state.currentDraft
            ? {
                ...state.currentDraft,
                attachments: state.currentDraft.attachments.filter(
                  (att) => att.id !== id
                ),
                lineItems: state.currentDraft.lineItems.filter(
                  (item) => item.attachmentId !== id
                ),
              }
            : null,
        })),

      updateMeta: (meta) =>
        set((state) => ({
          currentDraft: state.currentDraft
            ? {
                ...state.currentDraft,
                meta: { ...state.currentDraft.meta, ...meta },
              }
            : null,
        })),

      clearDraft: () => set({ currentDraft: null }),

      getTotalPrice: () => {
        const state = get();
        if (!state.currentDraft) return 0;
        return state.currentDraft.lineItems.reduce(
          (total, item) => total + (item.price || 0),
          0
        );
      },

      generateQuoteNumber,
    }),
    {
      name: 'coat24-quote-storage',
    }
  )
);