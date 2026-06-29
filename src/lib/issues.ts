import { Item, IssueType } from "./types";

const BLOCKING_ISSUES: IssueType[] = ["missing_name", "missing_price"];

export function getItemIssues(item: Item): IssueType[] {
  const issues: IssueType[] = [];
  if (!item.name || item.name.trim() === "") issues.push("missing_name");
  if (item.price == null || item.price.amount == null) issues.push("missing_price");
  if (!item.description || item.description.trim() === "") issues.push("missing_description");
  if (item.dietary_tags.some((t) => t.source === "inferred")) issues.push("dietary_inferred");
  return issues;
}

// Only name and price block approval. Description (and dietary/image) are informational —
// shown as issues, but a reviewer can approve and export without them.
export function getBlockingIssues(item: Item): IssueType[] {
  return getItemIssues(item).filter((issue) => BLOCKING_ISSUES.includes(issue));
}

export function canApprove(item: Item): boolean {
  return getBlockingIssues(item).length === 0;
}

export function isCatalogReady(item: Item): boolean {
  return getItemIssues(item).length === 0;
}
