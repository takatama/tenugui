import { useState, useCallback } from "react";
import { useAsyncOperation } from "./useAsyncOperation";

interface UseInlineEditOptions<T = string> {
  initialValue?: T;
  onSave?: (oldValue: T, newValue: T) => Promise<void>;
  onCancel?: () => void;
  validator?: (value: T) => boolean;
}

export function useInlineEdit<T = string>(
  options: UseInlineEditOptions<T> = {}
) {
  const { initialValue, onSave, onCancel, validator } = options;

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<T>(initialValue as T);

  // 非同期保存操作
  const saveOperation = useAsyncOperation(async (oldValue: T, newValue: T) => {
    if (onSave) {
      await onSave(oldValue, newValue);
    }
  });

  // 編集開始
  const startEdit = useCallback((itemId: string, currentValue: T) => {
    setEditingItem(itemId);
    setEditingValue(currentValue);
  }, []);

  // 編集キャンセル
  const cancelEdit = useCallback(() => {
    setEditingItem(null);
    setEditingValue(initialValue as T);
    onCancel?.();
  }, [initialValue, onCancel]);

  // 編集保存
  const saveEdit = useCallback(
    async (itemId: string, originalValue: T) => {
      if (!editingValue || (validator && !validator(editingValue))) {
        return;
      }

      const newValue = editingValue;
      if (newValue === originalValue) {
        cancelEdit();
        return;
      }

      try {
        await saveOperation.execute(originalValue, newValue);
        setEditingItem(null);
      } catch (error) {
        // エラーハンドリングは親コンポーネントで実行される
        console.error("Save failed:", error);
      }
    },
    [editingValue, validator, saveOperation, cancelEdit]
  );

  // キーボードイベントハンドリング
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent, itemId: string, originalValue: T) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveEdit(itemId, originalValue);
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    },
    [saveEdit, cancelEdit]
  );

  return {
    // State
    editingItem,
    editingValue,
    isEditing: (itemId: string) => editingItem === itemId,
    isSaving: saveOperation.loading,
    error: saveOperation.error,

    // Setters
    setEditingValue,

    // Actions
    startEdit,
    cancelEdit,
    saveEdit,
    handleKeyPress,
  };
}
