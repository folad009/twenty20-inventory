import { paginationSchema, idParamSchema } from "@/lib/validations";
import type { PaginationInput } from "@/lib/validations";

export function parsePagination(input: PaginationInput): PaginationInput {
  return paginationSchema.parse(input);
}

export function parseId(id: string): string {
  return idParamSchema.parse(id);
}
