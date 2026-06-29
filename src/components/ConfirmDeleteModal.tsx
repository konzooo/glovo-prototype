"use client";

import { Modal } from "./Modal";

export function ConfirmDeleteModal({
  open,
  onClose,
  itemName,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  itemName: string;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Delete item"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete
          </button>
        </>
      }
    >
      Delete {itemName ? `"${itemName}"` : "this item"}? This can&apos;t be undone.
    </Modal>
  );
}
