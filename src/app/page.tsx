"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRestaurantStore } from "@/lib/store";
import { canApprove } from "@/lib/issues";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

export default function RestaurantListPage() {
  const restaurants = useRestaurantStore((s) => s.restaurants);
  const ensureMocksSeeded = useRestaurantStore((s) => s.ensureMocksSeeded);
  const removeRestaurant = useRestaurantStore((s) => s.removeRestaurant);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    ensureMocksSeeded();
  }, [ensureMocksSeeded, restaurants.length]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Restaurants</h1>
        <Link href="/add" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
          + Onboard a new restaurant
        </Link>
      </div>

      <ul className="mt-8 space-y-3">
        {restaurants.map((r) => {
          const total = r.items.length;
          const ready = r.items.filter(canApprove).length;
          const approved = r.items.filter((i) => i.approved).length;
          return (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-4 hover:border-neutral-400"
            >
              <Link href={`/review/${r.id}`} className="flex-1">
                <p className="text-sm font-semibold text-neutral-900">{r.name}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {total} items · {ready} ready · {approved} approved
                </p>
              </Link>
              <button
                type="button"
                aria-label={`Delete ${r.name}`}
                onClick={() => setDeleteTarget({ id: r.id, name: r.name })}
                className="ml-3 rounded-md px-2 py-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
              >
                Delete
              </button>
            </li>
          );
        })}
        {restaurants.length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-400">
            No restaurants yet.
          </li>
        )}
      </ul>

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        itemName={deleteTarget?.name ?? ""}
        title="Delete restaurant"
        entityLabel="this restaurant"
        onConfirm={() => {
          if (deleteTarget) removeRestaurant(deleteTarget.id);
        }}
      />
    </main>
  );
}
