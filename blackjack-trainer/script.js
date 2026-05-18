const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const upcards = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];
const dealerRevealDelay = 787;
const dealerHitDelay = 908;

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
const strategyTablesEl = document.querySelector("#strategy-card-tables");
const betInput = document.querySelector("#bet-input");

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
let dealerPlaying = false;
let units = 0;
let correctPlays = 0;
let totalPlays = 0;

const hardRows = [
  { label: "17+", values: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"] },
  { label: "16", values: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"] },
  { label: "15", values: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"] },
  { label: "14", values: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"] },
  { label: "13", values: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"] },
  { label: "12", values: ["H", "H", "S", "S", "S", "H", "H", "H", "H", "H"] },
  { label: "11", values: ["D", "D", "D", "D", "D", "D", "D", "D", "D", "D"] },
  { label: "10", values: ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"] },
  { label: "9", values: ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"] },
  { label: "8-", values: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"] },
];

const softRows = [
  { label: "A,9", values: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"] },
  { label: "A,8", values: ["S", "S", "S", "S", "D", "S", "S", "S", "S", "S"] },
  { label: "A,7", values: ["D", "D", "D", "D", "D", "S", "S", "H", "H", "H"] },
  { label: "A,6", values: ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"] },
  { label: "A,5", values: ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"] },
  { label: "A,4", values: ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"] },
  { label: "A,3", values: ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"] },
  { label: "A,2", values: ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"] },
];

const pairRows = [
  { label: "A,A", values: ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"] },
  { label: "10,10", values: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"] },
  { label: "9,9", values: ["P", "P", "P", "P", "P", "S", "P", "P", "S", "S"] },
  { label: "8,8", values: ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"] },
  { label: "7,7", values: ["P", "P", "P", "P", "P", "P", "H", "H", "H", "H"] },
  { label: "6,6", values: ["P", "P", "P", "P", "P", "H", "H", "H", "H", "H"] },
  { label: "5,5", values: ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"] },
  { label: "4,4", values: ["H", "H", "H", "P", "P", "H", "H", "H", "H", "H"] },
  { label: "3,3", values: ["P", "P", "P", "P", "P", "P", "H", "H", "H", "H"] },
  { label: "2,2", values: ["P", "P", "P", "P", "P", "P", "H", "H", "H", "H"] },
];

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

function currentBet() {
  const value = Number.parseInt(betInput.value, 10);
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.min(value, 100);
}

function startRound() {
  dealerPlaying = false;
  dealerHand = [draw(), draw()];
  hands = [newHand([draw(), draw()], currentBet())];
  activeHand = 0;
  roundOver = false;
  strategyFeedbackEl.textContent = "Make your play.";
  strategyFeedbackEl.className = "";
  roundFeedbackEl.textContent = "Play your hand. Split hands are played left to right.";

  const player = hands[0];
  const dealer = handValue(dealerHand);

  if (handValue(player.cards).blackjack || dealer.blackjack) {
    beginDealerTurn();
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
  const handNumber = activeHand + 1;
  hand.cards.push(draw());
  const value = handValue(hand.cards);
  if (value.bust) {
    finishHand(`Hand ${handNumber} busted.`);
  } else if (hand.splitAces) {
    finishHand(`Hand ${handNumber} complete.`);
  }
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
  const handNumber = activeHand + 1;
  hand.bet *= 2;
  hand.doubled = true;
  hand.cards.push(draw());
  const value = handValue(hand.cards);
  finishHand(value.bust ? `Hand ${handNumber} doubled and busted.` : `Hand ${handNumber} doubled and is complete.`);
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

function finishHand(message = null) {
  const finishedHand = activeHand + 1;
  hands[activeHand].done = true;
  moveToNextHand();
  if (!roundOver && !dealerPlaying) {
    const prefix = message ?? `Hand ${finishedHand} complete.`;
    roundFeedbackEl.textContent = `${prefix} Now play Hand ${activeHand + 1} of ${hands.length}.`;
  } else if (message && dealerPlaying) {
    roundFeedbackEl.textContent = message;
  }
}

function moveToNextHand() {
  const nextIndex = hands.findIndex((hand, index) => index > activeHand && !hand.done);
  const fallbackIndex = hands.findIndex((hand) => !hand.done);
  const handIndex = nextIndex === -1 ? fallbackIndex : nextIndex;
  if (handIndex === -1) {
    beginDealerTurn();
    return;
  }
  activeHand = handIndex;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function dealerPlay() {
  dealerPlaying = true;
  roundFeedbackEl.textContent = "Dealer reveals the hole card.";
  render();
  await sleep(dealerRevealDelay);

  while (true) {
    const value = handValue(dealerHand);
    if (value.total > 17) return;
    if (value.total === 17 && !value.soft) return;
    roundFeedbackEl.textContent = value.total === 17 && value.soft
      ? "Dealer hits soft 17."
      : `Dealer hits ${value.total}.`;
    dealerHand.push(draw());
    render();
    await sleep(dealerHitDelay);
  }
}

async function beginDealerTurn() {
  if (dealerPlaying || roundOver) return;
  const dealerValue = handValue(dealerHand);
  const dealerBlackjack = dealerValue.blackjack;
  const dealerNeedsToPlay = !dealerBlackjack &&
    hands.some((hand) => !handValue(hand.cards).bust && !handValue(hand.cards).blackjack);

  if (dealerNeedsToPlay) {
    await dealerPlay();
  } else {
    dealerPlaying = true;
    roundFeedbackEl.textContent = "Dealer reveals the hole card.";
    render();
    await sleep(dealerRevealDelay);
  }

  settleRound();
}

function settleRound() {
  dealerPlaying = false;
  roundOver = true;
  activeHand = 0;
  const dealerValue = handValue(dealerHand);
  const dealerBlackjack = dealerValue.blackjack;

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

  roundFeedbackEl.textContent = `Hand result: ${results.join(", ")}.`;
  updateStats();
  render();
}

function updateStats() {
  bankrollEl.textContent = `Units ${units.toFixed(1)}`;
  accuracyEl.textContent = `Strategy ${correctPlays}/${totalPlays}`;
}

function actionClass(action) {
  return {
    H: "hit",
    S: "stand",
    D: "double",
    P: "split",
  }[action] ?? "";
}

function actionLabel(action) {
  return {
    H: "Hit",
    S: "Stand",
    D: "Double",
    P: "Split",
  }[action] ?? action;
}

function buildStrategyTable(title, rows) {
  const section = document.createElement("section");
  section.className = "strategy-table-section";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.textContent = "Hand";
  headerRow.append(corner);

  for (const upcard of upcards) {
    const th = document.createElement("th");
    th.textContent = upcard;
    headerRow.append(th);
  }

  thead.append(headerRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  for (const row of rows) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = row.label;
    tr.append(th);

    for (const action of row.values) {
      const td = document.createElement("td");
      td.className = actionClass(action);
      td.textContent = action;
      td.title = actionLabel(action);
      tr.append(td);
    }

    tbody.append(tr);
  }

  table.append(tbody);
  section.append(heading, table);
  return section;
}

function renderStrategyCard() {
  strategyTablesEl.replaceChildren(
    buildStrategyTable("Hard totals", hardRows),
    buildStrategyTable("Soft totals", softRows),
    buildStrategyTable("Pairs", pairRows),
  );
}

function renderCard(card, hidden = false) {
  const el = document.createElement("div");
  el.className = `card ${hidden ? "back" : ""} ${["♥", "♦"].includes(card.suit) ? "red" : ""}`;
  el.textContent = hidden ? "?" : `${card.rank}${card.suit}`;
  return el;
}

function render() {
  const hideHole = !roundOver && !dealerPlaying;
  dealerCardsEl.replaceChildren(...dealerHand.map((card, index) => renderCard(card, index === 1 && hideHole)));
  const dealerVisible = hideHole ? handValue([dealerHand[0]]) : handValue(dealerHand);
  dealerTotalEl.textContent = hideHole ? `Showing ${dealerVisible.total}` : `Total ${dealerVisible.total}`;

  const hand = hands[activeHand] ?? hands[0];
  playerCardsEl.replaceChildren(...hand.cards.map((card) => renderCard(card)));
  const playerValue = handValue(hand.cards);
  const showPlayerTotal = hand.done || roundOver;
  const totalText = showPlayerTotal
    ? `${playerValue.soft ? "Soft" : "Total"} ${playerValue.total}`
    : "Count it";
  playerTotalEl.textContent = `${totalText} • Bet ${hand.bet}`;
  playerLabelEl.textContent = hands.length > 1 ? `Hand ${activeHand + 1} of ${hands.length}` : "Your hand";

  const activeHandIsPlayable = !roundOver && !dealerPlaying && !hand.done;
  const splitAcesAwaitingResplit = hand.splitAces && canSplit(hand);
  controls.hit.disabled = !activeHandIsPlayable || hand.splitAces;
  controls.stand.disabled = !activeHandIsPlayable || splitAcesAwaitingResplit;
  controls.double.disabled = !activeHandIsPlayable || !canDouble(hand);
  controls.split.disabled = !activeHandIsPlayable || !canSplit(hand);
    controls.deal.disabled = dealerPlaying;
  betInput.disabled = !roundOver || dealerPlaying;

  handTabsEl.replaceChildren(...hands.map((item, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = index === activeHand ? "active" : "";
    const total = item.done || roundOver ? handValue(item.cards).total : "count it";
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
betInput.addEventListener("change", () => {
  betInput.value = currentBet();
});

function showStrategyCard() {
  strategyCard.hidden = false;
}

function hideStrategyCard() {
  strategyCard.hidden = true;
}

controls.card.addEventListener("pointerdown", showStrategyCard);
controls.card.addEventListener("pointerup", hideStrategyCard);
controls.card.addEventListener("pointerleave", hideStrategyCard);
controls.card.addEventListener("mousedown", showStrategyCard);
controls.card.addEventListener("mouseup", hideStrategyCard);
controls.card.addEventListener("mouseleave", hideStrategyCard);
controls.card.addEventListener("keydown", (event) => {
  if (event.key === " " || event.key === "Enter") showStrategyCard();
});
controls.card.addEventListener("keyup", hideStrategyCard);
controls.card.addEventListener("blur", hideStrategyCard);

deck = makeDeck();
renderStrategyCard();
updateStats();
startRound();
