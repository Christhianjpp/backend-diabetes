export type NoteCategory = "comida" | "bebida" | "café" | "snack" | "otro";
export type NoteVisibility = "private" | "public";

export interface PlaceInfo {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface ProductInfo {
  barcode?: string;
  brand?: string;
}

export interface PublicStats {
  likes: number;
  comments: number;
}

export interface Item {
  id: string;
  userId: string;
  title: string;
  liked: boolean;
  notes?: string;
  category?: NoteCategory;
  tags?: string[];
  photos?: string[];
  place?: PlaceInfo;
  product?: ProductInfo;
  visibility: NoteVisibility;
  remindAt?: number;
  createdAt: number;
  updatedAt: number;
  publicStats?: PublicStats;
}

export interface Like { id: string; itemId: string; userId: string; createdAt: number; }
export interface Comment { id: string; itemId: string; userId: string; text: string; createdAt: number; }


