export interface CreateTicketLineInput {
  label: string;
  amount: number;
  prize: number;
  subGameId?: string | null;
  subGameName?: string | null;
}

export interface CreateTicketApplicationInput {
  gameId: string;
  salePointId: string;
  sellerId: string;
  client: string | null;
  lines: CreateTicketLineInput[];
}
