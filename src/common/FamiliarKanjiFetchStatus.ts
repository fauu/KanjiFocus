export type FamiliarKanjiFetchStatus = (
  | { kind: "not-fetched" }
  | { kind: "fetching" }
  | { kind: "fetched", date: Date, size: number }
) & { previousFetchError?: string };
