"use client";

import { useState } from "react";

interface UseConfirmDeleteOptions {
  onDelete: () => Promise<void> | void;
  itemName?: string;
  itemType?: string;
  title?: string;
  description?: string;
}

export function useConfirmDelete({
  onDelete,
  itemName,
  itemType,
  title,
  description,
}: UseConfirmDeleteOptions) {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  const confirmDelete = async () => {
    await onDelete();
    closeDialog();
  };

  return {
    isOpen,
    openDialog,
    closeDialog,
    confirmDelete,
    dialogProps: {
      isOpen,
      onClose: closeDialog,
      onConfirm: confirmDelete,
      itemName,
      itemType,
      title,
      description,
    },
  };
}
