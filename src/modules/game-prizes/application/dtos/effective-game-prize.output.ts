/**
 * Payout multipliers for a single game AT a specific sucursal, with the
 * override merged over the game's default. `exactMultiplier`/`easyMultiplier`
 * are the effective values the client should use; `exactDefault`/`easyDefault`
 * are the game's baseline (unchanged by overrides) so the UI can show them
 * as placeholders. `hasOverride` toggles UI affordances (delete button,
 * highlight, etc.).
 */
export interface EffectiveGamePrizeOutput {
  gameId: string;
  gameName: string;
  exactDefault: number | null;
  easyDefault: number | null;
  exactMultiplier: number | null;
  easyMultiplier: number | null;
  overrideId: string | null;
  overrideExact: number | null;
  overrideEasy: number | null;
  hasOverride: boolean;
}

export interface ListEffectiveGamePrizesOutput {
  items: EffectiveGamePrizeOutput[];
}
