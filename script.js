const lines = window.poemLines ?? [];
const gameSize = 5;
const historyKey = "ts-eliot-line-quiz-history";

const lineElement = document.querySelector("#poem-line");
const sourceElement = document.querySelector("#poem-source");
const nextButton = document.querySelector("#line-button");
const newGameButton = document.querySelector("#new-game-button");
const gameProgress = document.querySelector("#game-progress");
const gameScore = document.querySelector("#game-score");
const choiceList = document.querySelector("#choice-list");
const answerFeedback = document.querySelector("#answer-feedback");
const gameSummary = document.querySelector("#game-summary");
const summaryScore = document.querySelector("#summary-score");
const replayCurrentButton = document.querySelector("#replay-current-button");
const stanzaPanel = document.querySelector("#stanza-panel");
const stanzaLinesElement = document.querySelector("#stanza-lines");
const stanzaSourceLink = document.querySelector("#stanza-source-link");
const historyList = document.querySelector("#history-list");
const clearHistoryButton = document.querySelector("#clear-history-button");

const eligibleIndexes = lines
  .map((line, index) => ({ line, index }))
  .filter(({ line }) => line.stanzaLineIndex < line.stanza.length - 1)
  .map(({ index }) => index);

let currentGame = [];
let currentQuestion = 0;
let currentIndex = 0;
let currentScore = 0;
let currentMistakes = 0;
let questionAnswered = false;
let completedGame = null;
let history = loadHistory();

function loadHistory() {
  try {
    const savedHistory = JSON.parse(localStorage.getItem(historyKey));
    return Array.isArray(savedHistory) ? savedHistory : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 20)));
}

function cleanDisplayLine(text) {
  return text
    .replace(/^[^\p{L}\p{N}]+/gu, "")
    .replace(/[^\p{L}\p{N}]+$/gu, "")
    .trim();
}

function correctNextLine(index) {
  const line = lines[index];
  return cleanDisplayLine(line.stanza[line.stanzaLineIndex + 1]);
}

function shuffled(items) {
  return items
    .map((item) => ({ item, sort: Math.random() }))
    .sort((left, right) => left.sort - right.sort)
    .map(({ item }) => item);
}

function uniqueRandomIndexes(count) {
  return shuffled(eligibleIndexes).slice(0, count);
}

function plausibleDistractors(correctAnswer) {
  const currentLine = lines[currentIndex];
  const answerLength = correctAnswer.length;
  const options = lines
    .map((line) => cleanDisplayLine(line.text))
    .filter((text, index, allOptions) => {
      return text &&
        text !== correctAnswer &&
        text !== cleanDisplayLine(currentLine.text) &&
        allOptions.indexOf(text) === index;
    })
    .map((text) => ({
      text,
      score: Math.abs(text.length - answerLength),
      sameSource: lines.find((line) => cleanDisplayLine(line.text) === text)?.source === currentLine.source,
    }))
    .sort((left, right) => {
      if (left.sameSource !== right.sameSource) return left.sameSource ? -1 : 1;
      return left.score - right.score;
    })
    .slice(0, 36);

  return shuffled(options).slice(0, 3).map((option) => option.text);
}

function updateGameBar() {
  const questionNumber = Math.min(currentQuestion + 1, gameSize);
  gameProgress.textContent = `Question ${questionNumber} of ${gameSize}`;
  gameScore.textContent = `Score ${currentScore}/${gameSize}`;
}

function renderChoices() {
  const correctAnswer = correctNextLine(currentIndex);
  const choices = shuffled([correctAnswer, ...plausibleDistractors(correctAnswer)]);

  choiceList.replaceChildren();
  answerFeedback.textContent = "";
  answerFeedback.className = "answer-feedback";

  for (const choice of choices) {
    const choiceButton = document.createElement("button");
    choiceButton.className = "choice-button";
    choiceButton.type = "button";
    choiceButton.textContent = choice;
    choiceButton.addEventListener("click", () => handleChoice(choice, correctAnswer, choiceButton));
    choiceList.append(choiceButton);
  }
}

function showQuestion(questionIndex) {
  currentQuestion = questionIndex;
  currentIndex = currentGame[currentQuestion];
  currentMistakes = 0;
  questionAnswered = false;
  completedGame = null;

  lineElement.textContent = cleanDisplayLine(lines[currentIndex].text);
  sourceElement.textContent = lines[currentIndex].source;
  stanzaPanel.hidden = true;
  gameSummary.hidden = true;
  nextButton.disabled = true;
  nextButton.textContent = currentQuestion === gameSize - 1 ? "Finish game" : "Next question";

  updateGameBar();
  renderChoices();
}

function startGame(indexes = uniqueRandomIndexes(gameSize)) {
  currentGame = indexes.slice(0, gameSize);
  currentScore = 0;
  currentQuestion = 0;
  completedGame = null;
  showQuestion(0);
}

function lockAllChoices() {
  for (const optionButton of choiceList.querySelectorAll("button")) {
    optionButton.disabled = true;
  }
}

function handleChoice(choice, correctAnswer, choiceButton) {
  if (questionAnswered) return;

  if (choice === correctAnswer) {
    questionAnswered = true;
    lockAllChoices();
    choiceButton.classList.add("is-correct");

    if (currentMistakes === 0) {
      currentScore += 1;
      answerFeedback.textContent = "Correct.";
    } else {
      answerFeedback.textContent = "Correct after a retry.";
    }

    answerFeedback.classList.add("is-correct");
    nextButton.disabled = false;
    updateGameBar();
    renderStanza();
    return;
  }

  currentMistakes += 1;
  choiceButton.classList.add("is-wrong");
  choiceButton.disabled = true;
  answerFeedback.textContent = "Wrong. Try again.";
  answerFeedback.classList.add("is-wrong");
}

function renderStanza() {
  const line = lines[currentIndex];
  stanzaLinesElement.replaceChildren();

  for (let index = 0; index < line.stanza.length; index += 1) {
    const stanzaLine = document.createElement("p");
    stanzaLine.textContent = cleanDisplayLine(line.stanza[index]);

    if (index === line.stanzaLineIndex) {
      stanzaLine.classList.add("is-selected");
    }

    if (index === line.stanzaLineIndex + 1) {
      stanzaLine.classList.add("is-answer");
    }

    stanzaLinesElement.append(stanzaLine);
  }

  stanzaSourceLink.href = line.sourceUrl;
  stanzaPanel.hidden = false;
}

function finishGame() {
  completedGame = {
    id: Date.now(),
    date: new Date().toISOString(),
    score: currentScore,
    total: gameSize,
    indexes: currentGame,
  };
  history = [completedGame, ...history].slice(0, 20);
  saveHistory();
  renderHistory();

  gameSummary.hidden = false;
  summaryScore.textContent = `Game complete: ${currentScore}/${gameSize}`;
  nextButton.disabled = true;
  nextButton.textContent = "Game complete";
}

function advanceGame() {
  if (!questionAnswered) return;

  if (currentQuestion >= gameSize - 1) {
    finishGame();
    return;
  }

  showQuestion(currentQuestion + 1);
}

function replayGame(indexes) {
  startGame(indexes);
}

function renderHistory() {
  historyList.replaceChildren();

  if (history.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "history-empty";
    emptyState.textContent = "No completed games yet.";
    historyList.append(emptyState);
    return;
  }

  for (const game of history) {
    const item = document.createElement("div");
    item.className = "history-item";

    const score = document.createElement("p");
    score.className = "history-score";
    score.textContent = `${game.score}/${game.total}`;

    const meta = document.createElement("p");
    meta.className = "history-meta";
    meta.textContent = new Date(game.date).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const replayButton = document.createElement("button");
    replayButton.className = "secondary-button";
    replayButton.type = "button";
    replayButton.textContent = game.score < game.total ? "Replay" : "Replay anyway";
    replayButton.addEventListener("click", () => replayGame(game.indexes));

    item.append(score, meta, replayButton);
    historyList.append(item);
  }
}

nextButton.addEventListener("click", advanceGame);
newGameButton.addEventListener("click", () => startGame());
replayCurrentButton.addEventListener("click", () => {
  if (completedGame) replayGame(completedGame.indexes);
});
clearHistoryButton.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
});

renderHistory();

if (eligibleIndexes.length > 0) {
  startGame();
}
