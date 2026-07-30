export interface CategoryOption {
  id: string;
  name: string | { so?: string; en?: string };
  icon?: string | null;
}

export interface CityOption {
  id: string;
  name: string | { so?: string; en?: string };
}
