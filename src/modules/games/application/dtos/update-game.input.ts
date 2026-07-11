export interface UpdateGameApplicationInput {
  id: string;
  name?: string;
  mainMultiplier?: number | null;
  secondaryMultiplier?: number | null;
  imagePath?: string | null;
  orderIndex?: number;
}
