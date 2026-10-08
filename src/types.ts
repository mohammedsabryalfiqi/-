export interface FontAxis {
  tag: string;
  min: number;
  default: number;
  max: number;
}

export interface FontRecord {
  id: string;
  /** bundled fonts: file name inside /public/fonts — uploaded fonts: original file name */
  file: string;
  name: string;
  nameArabic?: string | null;
  style?: string | null;
  version?: string | null;
  designer?: string | null;
  license?: string | null;
  licenseUrl?: string | null;
  format: string;
  size: number;
  arabic: boolean;
  latin: boolean;
  variable: boolean;
  axes?: FontAxis[] | null;
  numGlyphs?: number | null;
  weightClass?: number | null;
  tags: string[];
  note?: string | null;
  addedAt: string;
  source: "library" | "uploaded";
}

export type FilterKey = "all" | "arabic" | "variable" | "static" | "latin";
export type SortKey = "recent" | "name" | "size";
