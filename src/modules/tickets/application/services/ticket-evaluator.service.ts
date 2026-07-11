import { Inject, Injectable } from '@nestjs/common';

import type { Game } from '../../../games/domain/entities/game.entity';
import {
  DRAW_RESULTS_REPOSITORY,
  type DrawResultsRepository,
} from '../../../games/domain/repositories/draw-results.repository';
import {
  GAMES_REPOSITORY,
  type GamesRepository,
} from '../../../games/domain/repositories/games.repository';
import { GameType } from '../../../games/domain/value-objects/game-type';
import type { Ticket } from '../../domain/entities/ticket.entity';
import type { TicketLine } from '../../domain/value-objects/ticket-line';

export interface TicketLineEvaluation {
  label: string;
  amount: number;
  prize: number;
  wonPrize: number;
  isWinner: boolean;
  winningNumber: string | null;
  subGameId: string | null;
  subGameName: string | null;
}

export interface TicketEvaluation {
  ticketId: string;
  totalPrize: number;
  isWinner: boolean;
  hasPendingDraw: boolean;
  lines: TicketLineEvaluation[];
}

@Injectable()
export class TicketEvaluator {
  constructor(
    @Inject(GAMES_REPOSITORY) private readonly games: GamesRepository,
    @Inject(DRAW_RESULTS_REPOSITORY)
    private readonly results: DrawResultsRepository,
  ) {}

  async evaluate(ticket: Ticket): Promise<TicketEvaluation> {
    const parentGame = await this.games.findById(ticket.gameId);
    if (!parentGame) {
      return this.pending(ticket);
    }

    if (parentGame.type !== GameType.MULTI_SORTEO) {
      const result = await this.results.findByGameAndDraw(
        ticket.gameId,
        ticket.drawAt,
      );
      if (!result) return this.pending(ticket);
      const lines = ticket.lines.map((line) =>
        this.evaluateLine(line, parentGame.type, result.winningNumber),
      );
      return this.assemble(ticket.id, lines);
    }

    // Multi Sorteo: each line has a subGame; look up its game + result.
    const subGameNames = new Set<string>();
    const subGameIds = new Set<string>();
    for (const line of ticket.lines) {
      if (line.subGameId) subGameIds.add(line.subGameId);
      if (line.subGameName) subGameNames.add(line.subGameName.toLowerCase());
    }

    const catalog = await this.games.findAll({ onlyActive: false });
    const gamesById = new Map(catalog.map((g) => [g.id, g] as const));
    const gamesByName = new Map(
      catalog.map((g) => [g.name.toLowerCase(), g] as const),
    );

    const evaluations: TicketLineEvaluation[] = [];
    for (const line of ticket.lines) {
      const subGame = this.resolveSubGame(line, gamesById, gamesByName);
      if (!subGame || subGame.type === GameType.MULTI_SORTEO) {
        evaluations.push(this.missingSubGameLine(line));
        continue;
      }
      const result = await this.results.findByGameAndDraw(
        subGame.id,
        ticket.drawAt,
      );
      if (!result) {
        evaluations.push(this.missingSubGameLine(line));
        continue;
      }
      evaluations.push(
        this.evaluateLine(line, subGame.type, result.winningNumber),
      );
    }
    return this.assemble(ticket.id, evaluations);
  }

  private evaluateLine(
    line: TicketLine,
    gameType: GameType,
    winningNumber: string,
  ): TicketLineEvaluation {
    const isWinner = this.isMatch(gameType, line.label, winningNumber);
    return {
      label: line.label,
      amount: line.amount,
      prize: line.prize,
      wonPrize: isWinner ? line.prize : 0,
      isWinner,
      winningNumber,
      subGameId: line.subGameId,
      subGameName: line.subGameName,
    };
  }

  private isMatch(
    gameType: GameType,
    label: string,
    winningNumber: string,
  ): boolean {
    switch (gameType) {
      case GameType.REGULAR:
      case GameType.FOUR_DIGIT:
      case GameType.DATE:
        return this.normalizeLabel(label) === winningNumber.toLowerCase();
      case GameType.THREE_DIGIT: {
        const isFalso = /\(F\)/i.test(label);
        const digits = label.replace(/\(F\)/i, '').trim();
        if (isFalso) {
          return this.sortDigits(digits) === this.sortDigits(winningNumber);
        }
        return digits === winningNumber;
      }
      case GameType.MULTI_SORTEO:
        return false;
    }
  }

  private normalizeLabel(label: string): string {
    return label.replace(/\(F\)/i, '').trim().toLowerCase();
  }

  private sortDigits(value: string): string {
    return value.split('').sort().join('');
  }

  private resolveSubGame(
    line: TicketLine,
    byId: Map<string, Game>,
    byName: Map<string, Game>,
  ): Game | undefined {
    if (line.subGameId) return byId.get(line.subGameId);
    if (line.subGameName) return byName.get(line.subGameName.toLowerCase());
    return undefined;
  }

  private missingSubGameLine(line: TicketLine): TicketLineEvaluation {
    return {
      label: line.label,
      amount: line.amount,
      prize: line.prize,
      wonPrize: 0,
      isWinner: false,
      winningNumber: null,
      subGameId: line.subGameId,
      subGameName: line.subGameName,
    };
  }

  private assemble(
    ticketId: string,
    lines: TicketLineEvaluation[],
  ): TicketEvaluation {
    const totalPrize = lines.reduce((sum, l) => sum + l.wonPrize, 0);
    const hasPending = lines.some((l) => l.winningNumber === null);
    return {
      ticketId,
      totalPrize,
      isWinner: totalPrize > 0,
      hasPendingDraw: hasPending && totalPrize === 0,
      lines,
    };
  }

  private pending(ticket: Ticket): TicketEvaluation {
    return {
      ticketId: ticket.id,
      totalPrize: 0,
      isWinner: false,
      hasPendingDraw: true,
      lines: ticket.lines.map((line) => this.missingSubGameLine(line)),
    };
  }
}
