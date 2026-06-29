"use client";

import { useState } from "react";
import { Modal } from "./Modal";

export function MoveToSectionModal({
  open,
  onClose,
  sections,
  currentSection,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  sections: string[];
  currentSection: string | null;
  onConfirm: (section: string | null) => void;
}) {
  const [selected, setSelected] = useState<string>(currentSection ?? "");
  const [newSection, setNewSection] = useState("");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Move to section"
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
              const target = newSection.trim() || selected;
              onConfirm(target === "" ? null : target);
              onClose();
            }}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Move
          </button>
        </>
      }
    >
      <select
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value);
          setNewSection("");
        }}
        className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
      >
        <option value="">No section</option>
        {sections.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-neutral-400">Or create a new section:</p>
      <input
        type="text"
        value={newSection}
        onChange={(e) => setNewSection(e.target.value)}
        placeholder="e.g. Drinks"
        className="mt-1 w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
      />
    </Modal>
  );
}
