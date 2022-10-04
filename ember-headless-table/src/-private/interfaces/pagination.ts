export interface Pagination {
  formatItemSummary?: (data: { end: number; start: number; totalItems: number }) => string;
  onChange: (value: { page: number; pageSize: number }) => Promise<void> | void;
  page: number;
  pageSize: number;
  pageSizeLabel?: string;
  pageSizes?: number[];
  totalItems: number;
}
