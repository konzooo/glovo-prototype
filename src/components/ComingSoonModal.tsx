"use client";

import { Modal } from "./Modal";

export function ComingSoonModal({
  open,
  onClose,
  title = "Coming soon",
  description,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Got it
        </button>
      }
    >
      {description}
    </Modal>
  );
}
