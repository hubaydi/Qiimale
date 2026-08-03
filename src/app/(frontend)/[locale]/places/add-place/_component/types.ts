export interface CityOption {
  id: string;
  name: string;
  status?: "pending" | "approved" | "rejected";
}

export interface CategoryOption {
  id: string;
  name: string;
  description?: string | null;
  status?: "pending" | "approved" | "rejected";
}
