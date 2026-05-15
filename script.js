const lines = window.poemLines ?? [];

const lineElement = document.querySelector("#poem-line");
const sourceElement = document.querySelector("#poem-source");
const button = document.querySelector("#line-button");
const stanzaPanel = document.querySelector("#stanza-panel");
const stanzaLinesElement = document.querySelector("#stanza-lines");
const stanzaSourceLink = document.querySelector("#stanza-source-link");

let currentIndex = 0;
const recentIndexes = [];

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
  if (lines.length <= 1) return 0;

  const blockedIndexes = new Set(recentIndexes);
  let candidates = lines
    .map((line, index) => index)
    .filter((index) => !blockedIndexes.has(index));

  if (candidates.length === 0) {
    candidates = lines.map((line, index) => index);
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

function cleanDisplayLine(text) {
  return text
    .replace(/^[^\p{L}\p{N}]+/gu, "")
    .replace(/[^\p{L}\p{N}]+$/gu, "")
    .trim();
}

function showLine(index) {
  currentIndex = index;
  rememberIndex(currentIndex);
  lineElement.textContent = cleanDisplayLine(lines[currentIndex].text);
  sourceElement.textContent = lines[currentIndex].source;
  stanzaPanel.hidden = true;
}

function showNextLine() {
  showLine(pickNextIndex());
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

    stanzaLinesElement.append(stanzaLine);
  }

  stanzaSourceLink.href = line.sourceUrl;
  stanzaPanel.hidden = false;
  stanzaPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

if (lines.length > 0) {
  const openingIndex = lines.findIndex((line) => line.text === "Let us go then, you and I,");
  showLine(openingIndex >= 0 ? openingIndex : 0);
}

button.addEventListener("click", showNextLine);
lineElement.addEventListener("click", renderStanza);
