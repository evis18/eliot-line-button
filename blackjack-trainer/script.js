const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const upcards = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];

const dealerCardsEl = document.querySelector("#dealer-cards");
const playerCardsEl = document.querySelector("#player-cards");
const dealerTotalEl = document.querySelector("#dealer-total");
const playerTotalEl = document.querySelector("#player-total");
const playerLabelEl = document.querySelector("#player-label");
const bankrollEl = document.querySelector("#bankroll");
const accuracyEl = document.querySelector("#accuracy");
const strategyFeedbackEl = document.querySelector("#strategy-feedback");
const roundFeedbackEl = document.querySelector("#round-feedback");
const handTabsEl = document.querySelector("#hand-tabs");
const strategyCard = document.querySelector("#strategy-card");

const controls = {
  hit: document.querySelector("#hit-button"),
  stand: document.querySelector("#stand-button"),
  double: document.querySelector("#double-button"),
  split: document.querySelector("#split-button"),
  deal: document.querySelector("#deal-button"),
  card: document.querySelector("#strategy-card-button"),
};

let deck = [];
let dealerHand = [];
let hands = [];
let activeHand = 0;
let roundOver = true;
let units = 0;
let correctPlays = 0;
let totalPlays = 0;

function makeDeck() {
  const cards = [];
  for (let deckIndex = 0; deckIndex < 6; deckIndex += 1) {
    for (const suit of suits) {
      for (const rank of ranks) {
        cards.push({ rank, suit });
      }
    }
  }
  return shuffle(cards);
}

function shuffle(cards) {
  const copy = [...cards];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function draw() {
  if (deck.length < 60) deck = makeDeck();
  return deck.pop();
}

function cardValue(card) {
  if (card.rank === "A") return 11;
  if (["J", "Q", "K"].includes(card.rank)) return 10;
  return Number(card.rank);
}

function handValue(cards) {
  let total = cards.reduce((sum, card) => sum + cardValue(card), 0);
  let aces = cards.filter((card) => card.rank === "A").length;

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return {
    total,
    soft: aces > 0,
    blackjack: cards.length === 2 && total === 21,
    bust: total > 21,
  };
}

function dealerUpcard() {
  const rank = dealerHand[0].rank;
  return ["J", "Q", "K"].includes(rank) ? "10" : rank;
}

function pairRank(cards) {
  if (cards.length !== 2) return null;
  if (cardValue(cards[0]) !== cardValue(cards[1])) return null;
  return cards[0].rank === "A" ? "A" : String(cardValue(cards[0]));
}

function canDouble(hand) {
  return hand.cards.length === 2 && !hand.done && !hand.splitAces;
}

function canSplit(hand) {
  const pair = pairRank(hand.cards);
  return hand.cards.length === 2 &&
    pair &&
    hands.length < 4 &&
    !hand.done &&
    (!hand.splitAces || pair === "A");
}

function newHand(cards, bet = 1, fromSplit = false) {
  return { cards, bet, done: false, result: "", doubled: false, splitAces: false, fromSplit };
}

function startRound() {
  dealerHand = [draw(), draw()];
  hands = [newHand([draw(), draw()])];
  activeHand = 0;
  roundOver = false;
  strategyFeedbackEl.textContent = "Make your play.";
  strategyFeedbackEl.className = "";
  roundFeedbackEl.textContent = "Play your hand. Split hands are played left to right.";

  const player = hands[0];
  const dealer = handValue(dealerHand);

  if (handValue(player.cards).blackjack || dealer.blackjack) {
    settleRound();
  }

  render();
}

function normalizeAction(action, hand = hands[activeHand]) {
  if (action === "double" && !canDouble(hand)) return "hit";
  if (action === "split" && !canSplit(hand)) return "hit";
  return action;
}

function strategyFor(hand) {
  const upcard = dealerUpcard();
  const upIndex = upcards.indexOf(upcard);
  const value = handValue(hand.cards);
  const pair = pairRank(hand.cards);

  if (hand.cards.length === 2) {
    const surrender = surrenderAction(value, pair, upcard);
    if (surrender) return surrender;
  }

  if (pair && canSplit(hand)) {
    const splitMove = pairStrategy(pair, upIndex);
    if (splitMove === "split") return "split";
  }

  if (value.soft && value.total < 21) {
    return normalizeAction(softStrategy(value.total, upIndex), hand);
  }

  return normalizeAction(hardStrategy(value.total, upIndex), hand);
}

function surrenderAction(value, pair, upcard) {
  if (pair === "8" && upcard === "A") return "hit";
  if (value.total === 17 && upcard === "A") return "stand";
  if (value.total === 16 && ["9", "10", "A"].includes(upcard)) return "hit";
  if (value.total === 15 && ["10", "A"].includes(upcard)) return "hit";
  return null;
}

function pairStrategy(pair, upIndex) {
  const split = "split";
  const no = "no";
  const table = {
    A: [split, split, split, split, split, split, split, split, split, split],
    "10": [no, no, no, no, no, no, no, no, no, no],
    "9": [split, split, split, split, split, no, split, split, no, no],
    "8": [split, split, split, split, split, split, split, split, split, split],
    "7": [split, split, split, split, split, split, no, no, no, no],
    "6": [split, split, split, split, split, no, no, no, no, no],
    "5": [no, no, no, no, no, no, no, no, no, no],
    "4": [no, no, no, split, split, no, no, no, no, no],
    "3": [split, split, split, split, split, split, no, no, no, no],
    "2": [split, split, split, split, split, split, no, no, no, no],
  };
  return table[pair]?.[upIndex] ?? no;
}

function softStrategy(total, upIndex) {
  const h = "hit";
  const s = "stand";
  const d = "double";
  if (total >= 20) return s;
  const table = {
    19: [s, s, s, s, d, s, s, s, s, s],
    18: [d, d, d, d, d, s, s, h, h, h],
    17: [h, d, d, d, d, h, h, h, h, h],
    16: [h, h, d, d, d, h, h, h, h, h],
    15: [h, h, d, d, d, h, h, h, h, h],
    14: [h, h, h, d, d, h, h, h, h, h],
    13: [h, h, h, d, d, h, h, h, h, h],
  };
  return table[total]?.[upIndex] ?? h;
}

function hardStrategy(total, upIndex) {
  const h = "hit";
  const s = "stand";
  const d = "double";
  if (total >= 17) return s;
  if (total >= 13) return upIndex <= 4 ? s : h;
  if (total === 12) return upIndex >= 2 && upIndex <= 4 ? s : h;
  if (total === 11) return d;
  if (total === 10) return upIndex <= 7 ? d : h;
  if (total === 9) return upIndex >= 1 && upIndex <= 4 ? d : h;
  return h;
}

function explain(action, recommended) {
  const hand = hands[activeHand];
  const value = handValue(hand.cards);
  const up = dealerUpcard();
  const totalLabel = value.soft ? `soft ${value.total}` : `hard ${value.total}`;
  const pair = pairRank(hand.cards);
  const handLabel = pair ? `pair of ${pair}s` : totalLabel;
  const names = { hit: "hit", stand: "stand", double: "double", split: "split" };

  if (action === recommended) {
    return `Correct: basic strategy says to ${names[recommended]} ${handLabel} against dealer ${up}.`;
  }

  return `Basic strategy says to ${names[recommended]}, not ${names[action]}, with ${handLabel} against dealer ${up}. This matchup is where the math loses the least over time with ${names[recommended]}.`;
}

function checkStrategy(action) {
  const recommended = strategyFor(hands[activeHand]);
  const normalized = normalizeAction(action);
  totalPlays += 1;

  if (normalized === recommended) {
    correctPlays += 1;
    strategyFeedbackEl.className = "good";
  } else {
    strategyFeedbackEl.className = "bad";
  }

  strategyFeedbackEl.textContent = explain(normalized, recommended);
  updateStats();
}

function hit() {
  if (roundOver) return;
  checkStrategy("hit");
  const hand = hands[activeHand];
  hand.cards.push(draw());
  const value = handValue(hand.cards);
  if (value.bust || hand.splitAces) finishHand();
  render();
}

function stand() {
  if (roundOver) return;
  checkStrategy("stand");
  finishHand();
  render();
}

function doubleDown() {
  if (roundOver || !canDouble(hands[activeHand])) return;
  checkStrategy("double");
  const hand = hands[activeHand];
  hand.bet *= 2;
  hand.doubled = true;
  hand.cards.push(draw());
  finishHand();
  render();
}

function split() {
  const hand = hands[activeHand];
  if (roundOver || !canSplit(hand)) return;
  checkStrategy("split");
  const [first, second] = hand.cards;
  const splitAces = first.rank === "A";
  hands.splice(
    activeHand,
    1,
    { ...newHand([first, draw()], hand.bet, true), splitAces },
    { ...newHand([second, draw()], hand.bet, true), splitAces },
  );

  if (splitAces) {
    for (const splitAceHand of hands) {
      if (splitAceHand.splitAces && !canSplit(splitAceHand)) {
        splitAceHand.done = true;
      }
    }
    roundFeedbackEl.textContent = "Split aces receive one card each. If another ace appears, you may resplit up to four hands.";
    moveToNextHand();
  } else {
    roundFeedbackEl.textContent = `Split complete. Play Hand ${activeHand + 1} of ${hands.length}. You may double after splitting and resplit up to four hands.`;
  }

  render();
}

function finishHand() {
  const finishedHand = activeHand + 1;
  hands[activeHand].done = true;
  moveToNextHand();
  if (!roundOver) {
    roundFeedbackEl.textContent = `Hand ${finishedHand} complete. Now play Hand ${activeHand + 1} of ${hands.length}.`;
  }
}

function moveToNextHand() {
  const nextIndex = hands.findIndex((hand, index) => index > activeHand && !hand.done);
  const fallbackIndex = hands.findIndex((hand) => !hand.done);
  const handIndex = nextIndex === -1 ? fallbackIndex : nextIndex;
  if (handIndex === -1) {
    settleRound();
    return;
  }
  activeHand = handIndex;
}

function dealerPlay() {
  while (true) {
    const value = handValue(dealerHand);
    if (value.total > 17) return;
    if (value.total === 17 && !value.soft) return;
    dealerHand.push(draw());
  }
}

function settleRound() {
  roundOver = true;
  activeHand = 0;
  const dealerValue = handValue(dealerHand);
  const dealerBlackjack = dealerValue.blackjack;

  if (!dealerBlackjack && hands.some((hand) => !handValue(hand.cards).bust && !handValue(hand.cards).blackjack)) {
    dealerPlay();
  }

  const finalDealer = handValue(dealerHand);
  const results = [];

  for (const hand of hands) {
    const value = handValue(hand.cards);
    let delta = 0;
    let result = "";

    const naturalBlackjack = value.blackjack && !hand.fromSplit;

    if (naturalBlackjack && !dealerBlackjack) {
      delta = 1.5;
      result = "blackjack";
    } else if (value.bust) {
      delta = -hand.bet;
      result = "bust";
    } else if (dealerBlackjack && !value.blackjack) {
      delta = -hand.bet;
      result = "dealer blackjack";
    } else if (finalDealer.bust) {
      delta = hand.bet;
      result = "dealer bust";
    } else if (value.total > finalDealer.total) {
      delta = hand.bet;
      result = "win";
    } else if (value.total < finalDealer.total) {
      delta = -hand.bet;
      result = "lose";
    } else {
      result = "push";
    }

    hand.result = `${result} (${delta >= 0 ? "+" : ""}${delta})`;
    units += delta;
    results.push(hand.result);
  }

  roundFeedbackEl.textContent = `Dealer finished. Round over: ${results.join(", ")}.`;
  updateStats();
}

function updateStats() {
  bankrollEl.textContent = `Units ${units.toFixed(1)}`;
  accuracyEl.textContent = `Strategy ${correctPlays}/${totalPlays}`;
}

function renderCard(card, hidden = false) {
  const el = document.createElement("div");
  el.className = `card ${hidden ? "back" : ""} ${["♥", "♦"].includes(card.suit) ? "red" : ""}`;
  el.textContent = hidden ? "?" : `${card.rank}${card.suit}`;
  return el;
}

function render() {
  const hideHole = !roundOver;
  dealerCardsEl.replaceChildren(...dealerHand.map((card, index) => renderCard(card, index === 1 && hideHole)));
  const dealerVisible = hideHole ? handValue([dealerHand[0]]) : handValue(dealerHand);
  dealerTotalEl.textContent = hideHole ? `Showing ${dealerVisible.total}` : `Total ${dealerVisible.total}`;

  const hand = hands[activeHand] ?? hands[0];
  playerCardsEl.replaceChildren(...hand.cards.map((card) => renderCard(card)));
  const playerValue = handValue(hand.cards);
  playerTotalEl.textContent = `${playerValue.soft ? "Soft" : "Total"} ${playerValue.total} • Bet ${hand.bet}`;
  playerLabelEl.textContent = hands.length > 1 ? `Hand ${activeHand + 1} of ${hands.length}` : "Your hand";

  const activeHandIsPlayable = !roundOver && !hand.done;
  const splitAcesAwaitingResplit = hand.splitAces && canSplit(hand);
  controls.hit.disabled = !activeHandIsPlayable || hand.splitAces;
  controls.stand.disabled = !activeHandIsPlayable || splitAcesAwaitingResplit;
  controls.double.disabled = !activeHandIsPlayable || !canDouble(hand);
  controls.split.disabled = !activeHandIsPlayable || !canSplit(hand);

  handTabsEl.replaceChildren(...hands.map((item, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = index === activeHand ? "active" : "";
    const total = handValue(item.cards).total;
    const status = item.result || (item.done ? "done" : "playing");
    tab.textContent = `Hand ${index + 1}: ${total} • bet ${item.bet} • ${status}`;
    tab.disabled = index === activeHand;
    tab.addEventListener("click", () => {
      activeHand = index;
      render();
    });
    return tab;
  }));
}

controls.hit.addEventListener("click", hit);
controls.stand.addEventListener("click", stand);
controls.double.addEventListener("click", doubleDown);
controls.split.addEventListener("click", split);
controls.deal.addEventListener("click", startRound);

controls.card.addEventListener("pointerdown", () => {
  strategyCard.hidden = false;
});
controls.card.addEventListener("pointerup", () => {
  strategyCard.hidden = true;
});
controls.card.addEventListener("pointerleave", () => {
  strategyCard.hidden = true;
});

deck = makeDeck();
updateStats();
startRound();
