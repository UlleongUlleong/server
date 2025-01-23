export interface OffsetPagination {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

export interface CursorPagination {
  nextCursor: number | null;
  hasNext: boolean;
}

export type Pagination = OffsetPagination | CursorPagination;
