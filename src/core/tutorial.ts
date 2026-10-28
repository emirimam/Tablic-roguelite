// Skriptovane runde tutorijala (DESIGN_REVIEW §2). Karte "10D" = 10♦. Tekst koraka je u i18n (tut.<runda>.<korak>).
export type TutorialUntil = 'next' | 'capture' | 'lay';

export interface TutorialStep {
  /** dozvoljene karte u ruci (prazno = nijedna) */
  hand?: string[];
  /** dozvoljene karte na stolu */
  table?: string[];
  until: TutorialUntil;
}

export interface TutorialRound {
  table: string[];
  hand: string[];
  draw: string[];
  target: number;
  captures: number;
  lays: number;
  steps: TutorialStep[];
}

export const TUTORIAL: TutorialRound[] = [
  {
    table: ['7H', 'KS', '3D', '9C'],
    hand: ['7C', 'KD', '9H', '2S', '5D', '4C'],
    draw: ['6S', '8H', 'AD', '10C', '4H', 'QC', '2H', '8S', 'JD', '5S'],
    target: 75, captures: 5, lays: 3,
    steps: [
      { until: 'next' },
      { hand: ['7C'], table: ['7H'], until: 'capture' },
      { until: 'next' },
      { hand: ['KD'], table: ['KS'], until: 'capture' },
      { hand: ['9H'], table: ['9C'], until: 'capture' },
    ],
  },
  {
    table: ['AS', '7D', '6C', '4H'],
    hand: ['KD', 'AH', '8C', '3S', 'JH', '6D'],
    draw: ['9S', '2H', '5C', '7C', 'QH', '3C', '10S', '8D', '4S', 'JC'],
    target: 180, captures: 5, lays: 3,
    steps: [
      { until: 'next' },
      { hand: ['KD'], table: ['AS', '7D', '6C'], until: 'capture' },
      { until: 'next' },
      { hand: ['AH'], table: ['4H', '9S', '2H', '5C'], until: 'capture' },
    ],
  },
  {
    table: ['9C', '4D', '5H', 'JS'],
    hand: ['9H', 'KC', '3H', '8D', 'QD', '4S'],
    draw: ['2S', '6C', '5D', '7S', '10H', '3S', '8C', 'AH', '6H', 'QC'],
    target: 500, captures: 5, lays: 3,
    steps: [
      { until: 'next' },
      { hand: ['9H'], table: ['9C', '4D', '5H'], until: 'capture' },
      { until: 'next' },
      { hand: ['3H'], until: 'lay' },
      { hand: ['KC'], table: ['JS', '2S', '6C', '5D', '3H'], until: 'capture' },
    ],
  },
];
