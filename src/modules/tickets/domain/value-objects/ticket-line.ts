import { ValueObject } from '../../../../shared/domain/value-object';

export interface TicketLineProps {
  label: string;
  amount: number;
  prize: number;
  subGameId: string | null;
  subGameName: string | null;
  orderIndex: number;
}

export class TicketLine extends ValueObject<TicketLineProps> {
  constructor(props: TicketLineProps) {
    super(props);
  }

  get label(): string {
    return this.props.label;
  }

  get amount(): number {
    return this.props.amount;
  }

  get prize(): number {
    return this.props.prize;
  }

  get subGameId(): string | null {
    return this.props.subGameId;
  }

  get subGameName(): string | null {
    return this.props.subGameName;
  }

  get orderIndex(): number {
    return this.props.orderIndex;
  }
}
