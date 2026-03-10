export const VALUES_DISTRIBUTION = [
  { value: 1, count: 5 },
  { value: 2, count: 7 },
  { value: 3, count: 10 },
  { value: 4, count: 12 },
  { value: 5, count: 14 },
  { value: 6, count: 12 },
  { value: 7, count: 10 },
  { value: 8, count: 7 },
  { value: 9, count: 5 },
];

export const PENALTY_DISTRIBUTION = [
  { penalty: '+1', count: 20 },
  { penalty: '+2', count: 20 },
  { penalty: '+3', count: 15 },
  { penalty: '+4', count: 15 },
  { penalty: '+X', count: 12 },
] as const;

export type Penalty = typeof PENALTY_DISTRIBUTION[number]['penalty'];
export type Direction = 'UP' | 'DOWN';

export type Card = {
  id: string;
  value: number;
  penalty: Penalty;
};

export type Player = {
  id: string;
  name: string;
  isAI: boolean;
  hand: Card[];
  isEliminated: boolean;
};

export type Declaration = {
  playerId: string; // The player who declared
  cardId: string; // The physically played card
  declaredValue: number; // The number they said
  isResolved: boolean; // Has it survived the doubt phase?
};
