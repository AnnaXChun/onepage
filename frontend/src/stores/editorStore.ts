import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import { BlockType, BlockConfig } from '../types/block';

export interface BlockState {
  id: string;
  type: BlockType;
  content: string;
  config: BlockConfig;
  confidence?: number;
}

interface EditorState {
  blocks: BlockState[];
  selectedBlockId: string | null;
  isDirty: boolean;
  lastSaved: Date | null;

  // Actions
  setBlocks: (blocks: BlockState[]) => void;
  addBlock: (block: BlockState, index?: number) => void;
  removeBlock: (id: string) => void;
  updateBlock: (id: string, updates: Partial<BlockState>) => void;
  reorderBlocks: (oldIndex: number, newIndex: number) => void;
  selectBlock: (id: string | null) => void;
  markSaved: () => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    temporal(
      (set) => ({
        blocks: [],
        selectedBlockId: null,
        isDirty: false,
        lastSaved: null,

        setBlocks: (blocks) => set({ blocks, isDirty: true }),

        addBlock: (block, index) => set((state) => {
          const newBlocks = [...state.blocks];
          if (index !== undefined) {
            newBlocks.splice(index, 0, block);
          } else {
            newBlocks.push(block);
          }
          return { blocks: newBlocks, isDirty: true };
        }),

        removeBlock: (id) => set((state) => ({
          blocks: state.blocks.filter(b => b.id !== id),
          selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
          isDirty: true,
        })),

        updateBlock: (id, updates) => set((state) => ({
          blocks: state.blocks.map(b => b.id === id ? { ...b, ...updates } : b),
          isDirty: true,
        })),

        reorderBlocks: (oldIndex, newIndex) => set((state) => {
          const newBlocks = [...state.blocks];
          const [removed] = newBlocks.splice(oldIndex, 1);
          newBlocks.splice(newIndex, 0, removed);
          return { blocks: newBlocks, isDirty: true };
        }),

        selectBlock: (id) => set({ selectedBlockId: id }),

        markSaved: () => set({ isDirty: false, lastSaved: new Date() }),
      }),
      {
        limit: 50, // Max undo history
        equality: (pastState, currentState) => pastState.blocks === currentState.blocks,
      }
    ),
    {
      name: 'editor-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ blocks: state.blocks }),
    }
  )
);

// Type augmentation for temporal middleware
declare module 'zundo' {
  interface UseStore<T> {
    temporal: {
      getState: () => {
        undo: () => void;
        redo: () => void;
        pastStates: T[];
        futureStates: T[];
      };
    };
  }
}
