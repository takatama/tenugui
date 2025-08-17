import React from "react";
import { Button } from "../common";

interface SaveButtonProps {
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function SaveButton({
  hasUnsavedChanges,
  isLoading,
  onSave,
  onReset,
}: SaveButtonProps) {
  if (!hasUnsavedChanges) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4 sm:left-auto sm:right-4 sm:transform-none sm:translate-x-0">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-yellow-800 font-medium text-sm">
              未保存の変更
            </span>
          </div>
          <div className="flex space-x-2 ml-3">
            <Button
              onClick={onReset}
              variant="ghost"
              size="sm"
              disabled={isLoading}
              className="text-xs text-gray-600"
            >
              リセット
            </Button>
            <Button
              onClick={onSave}
              variant="primary"
              size="sm"
              disabled={isLoading}
              loading={isLoading}
              className="text-xs"
            >
              保存
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
