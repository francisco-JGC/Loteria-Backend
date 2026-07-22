export interface UpdateGameApplicationInput {
  id: string;
  name?: string;
  exactMultiplier?: number | null;
  easyMultiplier?: number | null;
  imagePath?: string | null;
  orderIndex?: number;
}
