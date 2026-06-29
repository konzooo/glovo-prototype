import { IssueType, ISSUE_LABELS } from "@/lib/types";

const ACTIVE_ISSUES = (Object.keys(ISSUE_LABELS) as IssueType[]).filter((issue) => issue !== "missing_image");

export type Filters = {
  pageLabel: string; // "all" or a source page label
  section: string; // "all" or a section name
  search: string;
  issue: IssueType | "all";
  approval: "all" | "approved" | "unapproved";
};

export const DEFAULT_FILTERS: Filters = {
  pageLabel: "all",
  section: "all",
  search: "",
  issue: "all",
  approval: "all",
};

export function FilterBar({
  pages,
  sections,
  filters,
  onChange,
}: {
  pages: string[];
  sections: string[];
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3">
      <input
        type="text"
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        placeholder="Search name or description…"
        className="min-w-[180px] flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm focus:border-neutral-400 focus:outline-none"
      />

      <select
        value={filters.pageLabel}
        onChange={(e) => onChange({ ...filters, pageLabel: e.target.value })}
        className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm focus:border-neutral-400 focus:outline-none"
      >
        <option value="all">All pages</option>
        {pages.map((page) => (
          <option key={page} value={page}>
            {page}
          </option>
        ))}
      </select>

      <select
        value={filters.section}
        onChange={(e) => onChange({ ...filters, section: e.target.value })}
        className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm focus:border-neutral-400 focus:outline-none"
      >
        <option value="all">All sections</option>
        {sections.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={filters.issue}
        onChange={(e) => onChange({ ...filters, issue: e.target.value as Filters["issue"] })}
        className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm focus:border-neutral-400 focus:outline-none"
      >
        <option value="all">All issues</option>
        {ACTIVE_ISSUES.map((issue) => (
          <option key={issue} value={issue}>
            {ISSUE_LABELS[issue]}
          </option>
        ))}
      </select>

      <select
        value={filters.approval}
        onChange={(e) => onChange({ ...filters, approval: e.target.value as Filters["approval"] })}
        className="rounded-md border border-neutral-200 px-2 py-1.5 text-sm focus:border-neutral-400 focus:outline-none"
      >
        <option value="all">All statuses</option>
        <option value="approved">Approved</option>
        <option value="unapproved">Not approved</option>
      </select>

      {(filters.pageLabel !== "all" ||
        filters.section !== "all" ||
        filters.search !== "" ||
        filters.issue !== "all" ||
        filters.approval !== "all") && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
