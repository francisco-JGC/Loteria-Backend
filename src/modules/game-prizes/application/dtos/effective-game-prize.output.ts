/**
 * Payout multipliers for a single game AT a specific sucursal, with the
 * override merged over the game's default. `main`/`secondary` are the
 * effective values the client should use; `mainDefault`/`secondaryDefault`
 * are the game's baseline (unchanged by overrides) so the UI can show them
 * as placeholders. `hasOverride` toggles UI affordances (delete button,
 * highlight, etc.).
 */
export interface EffectiveGamePrizeOutput {
  gameId: string;
  gameName: string;
  mainDefault: number | null;
  secondaryDefault: number | null;
  mainMultiplier: number | null;
  secondaryMultiplier: number | null;
  overrideId: string | null;
  overrideMain: number | null;
  overrideSecondary: number | null;
  hasOverride: boolean;
}

export interface ListEffectiveGamePrizesOutput {
  items: EffectiveGamePrizeOutput[];
}
