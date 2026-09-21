/**
 * Scum (Presidents) engine for the games lounge.
 *
 * Rules follow Bicycle Cards' Presidents:
 * https://bicyclecards.com/how-to-play/presidents
 *
 * - 3–6 players, one 52-card deck dealt entirely.
 * - Lead any single or any set of equal rank.
 * - Beat only with a higher set of the same length. Passing is always
 *   allowed, and a pass does not skip you later in the same trick.
 * - A trick ends when everyone else passes after the last play; that
 *   player leads again.
 * - First player out of cards is President; last with cards is Scum.
 *
 * Card ranking is Ace-high, 2-low (2 3 4 5 6 7 8 9 10 J Q K A). Suits never
 * matter. Hands keep going while anyone is seated: after a round, titles
 * stick and cards are taxed (President gets Scum's best, etc.).
 */

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;
export const DECK_SIZE = 52;

export const RANK_LABELS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
] as const;

export const SUIT_LABELS = ["♣", "♦", "♥", "♠"] as const;

export type ScumAction =
  | { type: "play"; cards: number[] }
  | { type: "pass" };

export type ScumPlay = {
  seat: number;
  cards: number[];
};

export type ScumState = {
  game: "scum";
  players: Array<{ id: string; handle: string; seat: number; bot?: boolean }>;
  viewers: Array<{ id: string; handle: string }>;
  dealerSeat: number;
  turnSeat: number;
  /** Seat → card ids still in that player's hand. */
  hands: Record<number, number[]>;
  lastPlay: ScumPlay | null;
  /** Consecutive passes since the last play (for ending a trick). */
  consecutivePasses: number;
  /** Seats that passed since the last play, for the HUD. */
  passedSincePlay: number[];
  /** Seats in the order they went out. Last remaining is appended at the end. */
  finishOrder: number[];
  /** Titles from the previous hand (President … Scum) until this one ends. */
  lastFinishOrder: number[];
  /** 1-based hand number. Stays on the table across rounds. */
  round: number;
  moveCount: number;
};

export function cardRank(id: number) {
  return Math.floor(id / 4);
}

export function cardSuit(id: number) {
  return id % 4;
}

export function isRedSuit(id: number) {
  const suit = cardSuit(id);
  return suit === 1 || suit === 2;
}

export function formatCard(id: number) {
  return `${RANK_LABELS[cardRank(id)]}${SUIT_LABELS[cardSuit(id)]}`;
}

export function sameSet(cards: number[]) {
  if (cards.length < 1 || cards.length > 4) return false;
  const unique = new Set(cards);
  if (unique.size !== cards.length) return false;
  const rank = cardRank(cards[0]);
  return cards.every((card) => cardRank(card) === rank);
}

export function beats(previous: number[], next: number[]) {
  return (
    sameSet(previous) &&
    sameSet(next) &&
    next.length === previous.length &&
    cardRank(next[0]) > cardRank(previous[0])
  );
}

export function makeRand(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

export function shuffle<T>(items: T[], rand: () => number = Math.random) {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const swap = next[i];
    next[i] = next[j]!;
    next[j] = swap!;
  }
  return next;
}

/**
 * Deal every card, starting to the dealer's left (seat after dealer,
 * wrapping in seat order).
 */
export function dealHands(
  seats: number[],
  dealerSeat: number,
  rand: () => number = Math.random,
) {
  const ordered = seats.slice().sort((a, b) => a - b);
  const dealerIndex = ordered.indexOf(dealerSeat);
  const start = dealerIndex < 0 ? 0 : (dealerIndex + 1) % ordered.length;
  const deck = shuffle(
    Array.from({ length: DECK_SIZE }, (_, id) => id),
    rand,
  );
  const hands: Record<number, number[]> = {};
  for (const seat of ordered) hands[seat] = [];
  deck.forEach((card, index) => {
    const seat = ordered[(start + index) % ordered.length]!;
    hands[seat]!.push(card);
  });
  for (const seat of ordered) {
    hands[seat]!.sort(
      (a, b) => cardRank(a) - cardRank(b) || cardSuit(a) - cardSuit(b),
    );
  }
  return hands;
}

export function activeSeats(state: Pick<ScumState, "hands" | "players">) {
  return state.players
    .map((player) => player.seat)
    .filter((seat) => (state.hands[seat] ?? []).length > 0)
    .sort((a, b) => a - b);
}

export function nextAliveSeat(state: ScumState, fromSeat: number) {
  const seats = state.players.map((player) => player.seat).sort((a, b) => a - b);
  const alive = new Set(activeSeats(state));
  const start = Math.max(0, seats.indexOf(fromSeat));
  for (let step = 1; step <= seats.length; step += 1) {
    const seat = seats[(start + step) % seats.length]!;
    if (alive.has(seat)) return seat;
  }
  return fromSeat;
}

export function rankTitle(place: number, total: number) {
  if (place === 1) return "President";
  if (place === total) return "Scum";
  if (place === 2 && total >= 4) return "Vice President";
  if (place === total - 1 && total >= 4) return "Vice Scum";
  return `${place}${ordinal(place)}`;
}

function ordinal(place: number) {
  const rem100 = place % 100;
  if (rem100 >= 11 && rem100 <= 13) return "th";
  if (place % 10 === 1) return "st";
  if (place % 10 === 2) return "nd";
  if (place % 10 === 3) return "rd";
  return "th";
}

export function cardsInHand(hand: number[], cards: number[]) {
  const available = new Map<number, number>();
  for (const card of hand) available.set(card, (available.get(card) ?? 0) + 1);
  for (const card of cards) {
    const left = available.get(card) ?? 0;
    if (left < 1) return false;
    available.set(card, left - 1);
  }
  return true;
}

export function legalScumActions(state: ScumState, seat: number): ScumAction[] {
  const hand = state.hands[seat] ?? [];
  const groups = new Map<number, number[]>();
  for (const card of hand) {
    const rank = cardRank(card);
    const group = groups.get(rank) ?? [];
    group.push(card);
    groups.set(rank, group);
  }
  const actions: ScumAction[] = [];
  const need = state.lastPlay?.cards.length ?? 0;
  for (const group of groups.values()) {
    const max = Math.min(4, group.length);
    const start = need > 0 ? need : 1;
    const end = need > 0 ? need : max;
    if (start > max) continue;
    for (let len = start; len <= end; len += 1) {
      const cards = group.slice(0, len);
      const action: ScumAction = { type: "play", cards };
      if (isLegalAction(state, seat, action)) actions.push(action);
    }
  }
  if (isLegalAction(state, seat, { type: "pass" })) {
    actions.push({ type: "pass" });
  }
  return actions;
}

export function isLegalAction(state: ScumState, seat: number, action: ScumAction) {
  if (state.turnSeat !== seat) return false;
  if ((state.hands[seat] ?? []).length === 0) return false;

  if (action.type === "pass") {
    return state.lastPlay !== null;
  }

  const unique = Array.from(new Set(action.cards));
  if (unique.length !== action.cards.length) return false;
  if (!sameSet(unique)) return false;
  if (!cardsInHand(state.hands[seat] ?? [], unique)) return false;
  if (!state.lastPlay) return true;
  return beats(state.lastPlay.cards, unique);
}

function finishIfNeeded(state: ScumState) {
  const alive = activeSeats(state);
  if (alive.length > 1) return false;
  if (alive.length === 1 && !state.finishOrder.includes(alive[0]!)) {
    state.finishOrder.push(alive[0]!);
  }
  return true;
}

function endTrick(state: ScumState) {
  const lastSeat = state.lastPlay?.seat;
  state.lastPlay = null;
  state.consecutivePasses = 0;
  state.passedSincePlay = [];
  if (lastSeat == null) return;
  const alive = new Set(activeSeats(state));
  state.turnSeat = alive.has(lastSeat)
    ? lastSeat
    : nextAliveSeat(state, lastSeat);
}

export function applyScumAction(
  state: ScumState,
  seat: number,
  action: ScumAction,
): { ok: true; finished: boolean } | { ok: false; error: string } {
  if (!isLegalAction(state, seat, action)) {
    if (state.turnSeat !== seat) return { ok: false, error: "Not your turn" };
    if (action.type === "pass" && !state.lastPlay) {
      return { ok: false, error: "The leader has to play something" };
    }
    return { ok: false, error: "Illegal play" };
  }

  if (action.type === "pass") {
    state.consecutivePasses += 1;
    if (!state.passedSincePlay.includes(seat)) state.passedSincePlay.push(seat);
    state.moveCount += 1;
    const others = activeSeats(state).filter(
      (entry) => entry !== state.lastPlay?.seat,
    ).length;
    if (others > 0 && state.consecutivePasses >= others) {
      endTrick(state);
    } else {
      state.turnSeat = nextAliveSeat(state, seat);
    }
    return { ok: true, finished: false };
  }

  const unique = Array.from(new Set(action.cards));
  const hand = (state.hands[seat] ?? []).filter((card) => !unique.includes(card));
  state.hands[seat] = hand;
  state.lastPlay = { seat, cards: unique };
  state.consecutivePasses = 0;
  state.passedSincePlay = [];
  state.moveCount += 1;

  if (hand.length === 0 && !state.finishOrder.includes(seat)) {
    state.finishOrder.push(seat);
  }

  if (finishIfNeeded(state)) {
    return { ok: true, finished: true };
  }

  state.turnSeat = nextAliveSeat(state, seat);
  return { ok: true, finished: false };
}

function sortHand(cards: number[]) {
  return cards
    .slice()
    .sort((a, b) => cardRank(a) - cardRank(b) || cardSuit(a) - cardSuit(b));
}

function takeHighest(hand: number[], count: number) {
  const ranked = hand
    .slice()
    .sort((a, b) => cardRank(b) - cardRank(a) || cardSuit(b) - cardSuit(a));
  const taken = ranked.slice(0, count);
  const skip = new Set(taken);
  return {
    taken,
    kept: hand.filter((card) => !skip.has(card)),
  };
}

function takeLowest(hand: number[], count: number) {
  const ranked = sortHand(hand);
  const taken = ranked.slice(0, count);
  const skip = new Set(taken);
  return {
    taken,
    kept: hand.filter((card) => !skip.has(card)),
  };
}

/**
 * Scum/Vice Scum give their highest cards; President/VP give the same number
 * of lowest cards back after receiving them.
 */
export function taxSwap(state: ScumState, fromSeat: number, toSeat: number, count: number) {
  if (count < 1) return;
  const fromHand = state.hands[fromSeat] ?? [];
  const toHand = state.hands[toSeat] ?? [];
  const give = Math.min(count, fromHand.length, toHand.length);
  if (give < 1) return;
  const high = takeHighest(fromHand, give);
  const received = toHand.concat(high.taken);
  const low = takeLowest(received, give);
  state.hands[fromSeat] = sortHand(high.kept.concat(low.taken));
  state.hands[toSeat] = sortHand(low.kept);
}

export function applyTaxes(state: ScumState, finishOrder: number[]) {
  const total = finishOrder.length;
  if (total < 3) return;
  const president = finishOrder[0]!;
  const scum = finishOrder[total - 1]!;
  if (total === 3) {
    taxSwap(state, scum, president, 1);
    return;
  }
  taxSwap(state, scum, president, 2);
  const vicePresident = finishOrder[1]!;
  const viceScum = finishOrder[total - 2]!;
  taxSwap(state, viceScum, vicePresident, 1);
}

/** Deal the next hand: Scum deals, titles stick, then tax the new cards. */
export function beginNextRound(state: ScumState, rand: () => number = Math.random) {
  const order =
    state.finishOrder.length === state.players.length
      ? state.finishOrder.slice()
      : (state.lastFinishOrder ?? []).slice();
  state.round = (state.round ?? 1) + 1;
  if (order.length === state.players.length && order.length > 0) {
    state.lastFinishOrder = order;
    state.dealerSeat = order[order.length - 1]!;
  }
  dealScum(state, rand);
  if (order.length === state.players.length) applyTaxes(state, order);
}

export function emptyScumState(): ScumState {
  return {
    game: "scum",
    players: [],
    viewers: [],
    dealerSeat: 1,
    turnSeat: 1,
    hands: {},
    lastPlay: null,
    consecutivePasses: 0,
    passedSincePlay: [],
    finishOrder: [],
    lastFinishOrder: [],
    round: 1,
    moveCount: 0,
  };
}

export function dealScum(state: ScumState, rand: () => number = Math.random) {
  const seats = state.players.map((player) => player.seat);
  const dealerSeat = state.dealerSeat;
  state.hands = dealHands(seats, dealerSeat, rand);
  state.lastPlay = null;
  state.consecutivePasses = 0;
  state.passedSincePlay = [];
  state.finishOrder = [];
  state.turnSeat = nextAliveSeat(
    { ...state, hands: state.hands },
    dealerSeat,
  );
}
