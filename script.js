const lines = window.poemLines ?? [];

const lineElement = document.querySelector("#poem-line");
const sourceElement = document.querySelector("#poem-source");
const button = document.querySelector("#line-button");
const choiceList = document.querySelector("#choice-list");
const answerFeedback = document.querySelector("#answer-feedback");
const stanzaPanel = document.querySelector("#stanza-panel");
const stanzaLinesElement = document.querySelector("#stanza-lines");
const stanzaSourceLink = document.querySelector("#stanza-source-link");

let currentIndex = 0;
const recentIndexes = [];
const eligibleIndexes = lines
  .map((line, index) => ({ line, index }))
  .filter(({ line }) => line.stanzaLineIndex < line.stanza.length - 1)
  .map(({ index }) => index);

function recentWindowSize() {
  return Math.min(120, Math.floor(lines.length * 0.18));
}

function rememberIndex(index) {
  recentIndexes.push(index);

  while (recentIndexes.length > recentWindowSize()) {
    recentIndexes.shift();
  }
}

function pickNextIndex() {
  if (eligibleIndexes.length <= 1) return eligibleIndexes[0] ?? 0;

  const blockedIndexes = new Set(recentIndexes);
  let candidates = eligibleIndexes
    .filter((index) => !blockedIndexes.has(index));

  if (candidates.length === 0) {
    candidates = eligibleIndexes;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
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

function showLine(index) {
  currentIndex = index;
  rememberIndex(currentIndex);
  lineElement.textContent = cleanDisplayLine(lines[currentIndex].text);
  sourceElement.textContent = lines[currentIndex].source;
  stanzaPanel.hidden = true;
  renderChoices();
}

function showNextLine() {
  showLine(pickNextIndex());
}

function lockChoices() {
  for (const choiceButton of choiceList.querySelectorAll("button")) {
    choiceButton.disabled = true;
  }
}

function handleChoice(choice, correctAnswer, choiceButton) {
  lockChoices();

  if (choice === correctAnswer) {
    choiceButton.classList.add("is-correct");
    answerFeedback.textContent = "Correct.";
    answerFeedback.classList.add("is-correct");
    renderStanza();
    return;
  }

  choiceButton.classList.add("is-wrong");
  answerFeedback.textContent = "Wrong.";
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
  stanzaPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

if (eligibleIndexes.length > 0) {
  const openingIndex = lines.findIndex((line) => line.text === "Let us go then, you and I,");
  showLine(openingIndex >= 0 ? openingIndex : 0);
}

button.addEventListener("click", showNextLine);
