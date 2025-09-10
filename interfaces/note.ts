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
  views?: number;  // Nuevo: contador de vistas
  agreements?: number; // Nuevo: contador de acuerdos
}

export interface Item {
  id: string;
  userId: string;
  title: string;
  isImportant: boolean;  // Renombrado de 'liked'
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
  publicStats: PublicStats;  // Requerido (no opcional)
  
  // Campo agregado por consultas con lookup
  isLikedByCurrentUser?: boolean;
  // Nuevo campo agregado por consultas con lookup
  isAgreedByCurrentUser?: boolean;
}

export interface Like { id: string; noteId: string; userId: string; createdAt: number; }
export interface Comment { id: string; itemId: string; userId: string; text: string; createdAt: number; }


