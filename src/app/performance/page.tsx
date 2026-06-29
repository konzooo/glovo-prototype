import Link from "next/link";

type FieldStat = {
  field: string;
  editRate: number; // % of filled values a reviewer changed before export
};

// Illustrative numbers only — see disclaimer below. Not computed from live session data.
const FIELD_STATS: FieldStat[] = [
  { field: "Price", editRate: 9 },
  { field: "Name", editRate: 6 },
  { field: "Section", editRate: 12 },
  { field: "Dietary tags", editRate: 28 },
  { field: "Description", editRate: 41 },
];

const APPROVE_RATE = 62; // % of items approved with zero field edits
const SAMPLE_SIZE = "34 items across 2 menus";

export default function PerformancePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Performance &amp; monitoring</h1>
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Back
        </Link>
      </div>

      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <span className="font-medium">Sample view, not live data.</span> These numbers illustrate
        the metric framework this page would track at real volume. With only {SAMPLE_SIZE} reviewed
        so far, a computed accuracy stat would be false precision — so this is a mock, labeled as one.
      </div>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Approval rate</p>
        <p className="mt-1 text-3xl font-semibold text-neutral-900">{APPROVE_RATE}%</p>
        <p className="mt-1 text-sm text-neutral-500">of items approved with zero field edits ({SAMPLE_SIZE})</p>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Edit rate by field</p>
        <p className="mt-1 text-sm text-neutral-500">
          Share of AI-filled values a reviewer changed before export.
        </p>
        <div className="mt-4 divide-y divide-neutral-100">
          {FIELD_STATS.map((stat) => (
            <div key={stat.field} className="flex items-center justify-between py-2 text-sm">
              <span className="text-neutral-800">{stat.field}</span>
              <span className="font-medium text-neutral-900">{stat.editRate}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Why this page exists</p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-neutral-700">
          <li>Today: every field is reviewed, every item, every menu.</li>
          <li>Next: once a field&apos;s edit rate stays low over real volume, it auto-approves and only exceptions surface for review — review by exception, not review by default.</li>
          <li>Each human edit doubles as a labeled example, so the edit rate improves as the dataset grows.</li>
          <li>Full unattended approval (e.g. restaurant self-service) is a liability transfer, not just an automation step — that decision needs Legal/Data team sign-off, not just a high approval rate.</li>
        </ol>
      </section>
    </main>
  );
}
