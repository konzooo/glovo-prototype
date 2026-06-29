import { Item, IssueType } from "./types";

export function getItemIssues(item: Item): IssueType[] {
  const issues: IssueType[] = [];
  if (!item.name || item.name.trim() === "") issues.push("missing_name");
  if (item.price == null || item.price.amount == null) issues.push("missing_price");
  if (!item.description || item.description.trim() === "") issues.push("missing_description");
  if (item.dietary_tags.some((t) => t.source === "inferred")) issues.push("dietary_inferred");
  return issues;
}

export function canApprove(item: Item): boolean {
  // Mandatory for this MVP: name, price, and description. Photos are optional for now.
  return !!item.name?.trim() && item.price?.amount != null && !!item.description?.trim();
}

export function isCatalogReady(item: Item): boolean {
  return getItemIssues(item).length === 0;
}
