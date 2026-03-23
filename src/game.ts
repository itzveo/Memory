import "./styles/pages/game.scss";
import { code, foods } from "./cards";

const theme = sessionStorage.getItem("theme");
const player = sessionStorage.getItem("player");
const board = parseInt(sessionStorage.getItem("board") || "16", 10);

const dialog = document.getElementById("exit_dialog") as HTMLElement;
const bgO = document.getElementById("bgO") as HTMLElement;

const THEMES = {
  "Code vibes theme": {
    array: code,
    back: "code_back.png",
    path: "./public/code/",
  },
  "Foods theme": {
    array: foods,
    back: "foods_back.png",
    path: "./public/foods/",
  },
} as const;


/**
 * Loads the theme-specific stylesheet dynamically via code splitting.
 * @param theme - The name of the selected theme, or null if none is set.
 */
export function loadTheme(theme: string | null) {
  if (theme === "Code vibes theme") {
    import("./styles/themes/code.scss");
  } else if (theme === "Foods theme") {
    import("./styles/themes/foods.scss");
  }
}

/**
 * Updates UI elements (images, labels) to match the Code vibes theme.
 */
function returnCodeObjects() {
  (document.getElementById("player_blue") as HTMLImageElement).src =
    "./public/label_blue.svg";
  (document.getElementById("player_orange") as HTMLImageElement).src =
    "./public/label_orange.svg";
  (document.getElementById("exit_icon") as HTMLImageElement).src =
    "./public/exit.svg";
  (document.getElementById("restart") as HTMLElement).innerHTML =
    "Back to start";
}

/**
 * Updates UI elements (images, labels) to match the Foods theme.
 */
function returnFoodObjects() {
  (document.getElementById("player_blue") as HTMLImageElement).src =
    "./public/chess_blue.svg";
  (document.getElementById("player_orange") as HTMLImageElement).src =
    "./public/chess_orange.svg";
  (document.getElementById("exit_icon") as HTMLImageElement).src =
    "./public/exit_orange.svg";
  (document.getElementById("restart") as HTMLElement).innerHTML = "Home";
}

/**
 * Delegates to the appropriate theme-specific UI update function.
 * @param theme - The active theme name, or null.
 */
function loadThemeObjects(theme: string | null) {
  if (theme === "Code vibes theme") {
    returnCodeObjects();
  } else if (theme === "Foods theme") {
    returnFoodObjects();
  }
}

/**
 * Returns the configuration object (card array, back image, asset path)
 * for the given theme, falling back to "Code vibes theme" if not found.
 * @param theme - The theme name to look up.
 * @returns The corresponding entry.
 */
function getThemeConfig(theme: string) {
  return THEMES[theme as keyof typeof THEMES] ?? THEMES["Code vibes theme"];
}

/**
 * Creates a flip-card button element with a front and back face.
 * @param frontSrc - Image source for the front (back) face of the card.
 * @param backSrc  - Image source for the back (revealed) face of the card.
 * @returns A fully constructed card 
 */
function createCard(frontSrc: string, backSrc: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.classList.add("card");

  const inner = document.createElement("div");
  inner.classList.add("card__inner");

  const front = document.createElement("img");
  front.classList.add("card__face");
  front.src = frontSrc;

  const back = document.createElement("img");
  back.classList.add("card__face", "card__face--back");
  back.src = backSrc;

  inner.appendChild(front);
  inner.appendChild(back);
  button.appendChild(inner);
  return button;
}

/**
 * Selects a subset of card images, duplicates them to form pairs, and
 * returns them in a randomly shuffled order.
 * @param array - Full list of available card image filenames.
 * @param count - Total number of cards to place on the board (must be even).
 * @returns Shuffled array of image filenames with each value appearing twice.
 */
function getShuffledPairs(array: string[], count: number): string[] {
  const selected = array.slice(0, count);
  const pairs = [...selected, ...selected];

  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  return pairs;
}

/**
 * Applies the correct CSS grid layout to the board element based on
 * the total number of cards.
 * @param boardEl - The board container element.
 * @param board   - Total card count (16 | 24 | 36).
 */
function setGridLayout(boardEl: HTMLElement, board: number) {
  const layouts: Record<number, [string, string]> = {
    16: ["repeat(4, 1fr)", "repeat(4, 1fr)"],
    24: ["repeat(4, 1fr)", "repeat(6, 1fr)"],
    36: ["repeat(6, 1fr)", "repeat(6, 1fr)"],
  };
  const [rows, cols] = layouts[board] ?? layouts[16];
  boardEl.style.gridTemplateRows = rows;
  boardEl.style.gridTemplateColumns = cols;
}

type Player = "blue" | "orange";
type GameResult = Player | "tie";

/**
 * Returns the player whose turn follows the given player.
 * @param current - The player whose turn just ended.
 * @returns The opposing player.
 */
function getNextPlayer(current: Player): Player {
  return current === "blue" ? "orange" : "blue";
}

/**
 * Updates the current-player indicator image to reflect whose turn it is.
 * @param player - The player now taking their turn.
 * @param theme  - The active theme name, or null.
 */
function updatePlayerIndicator(player: Player, theme: string | null) {
  const el = document.getElementById("currentPlayer") as HTMLImageElement;
  const p = player.toLowerCase() as Player;
  if (theme === "Code vibes theme") {
    el.src = `./public/label_${p}.svg`;
    el.style.backgroundColor = "";
  } else if (theme === "Foods theme") {
    el.src = "./public/chess_white.svg";
    el.style.backgroundColor = p === "blue" ? "#2bb1ff" : "#f58e39";
  }
}

/**
 * Increments the displayed score counter for the given player by one.
 * @param player - The player who just scored a matched pair.
 */
function updateScore(player: Player) {
  const scoreEl = document.getElementById(`score_${player}`)!;
  scoreEl.textContent = (parseInt(scoreEl.textContent || "0") + 1).toString();
}

/**
 * Marks two matched cards as permanently revealed, updates the score,
 * checks for game-end, and releases the board lock.
 * @param first         - The first flipped card.
 * @param second        - The second flipped card.
 * @param releaseLock   - Callback that resets the flipped-card state and unlocks the board.
 * @param currentPlayer - The player who made the match.
 * @param boardEl       - The board container element.
 * @param theme         - The active theme name, or null.
 */
function handleMatch(
  first: HTMLButtonElement,
  second: HTMLButtonElement,
  releaseLock: () => void,
  currentPlayer: Player,
  boardEl: HTMLElement,
  theme: string | null
) {
  first.classList.add("is-matched");
  second.classList.add("is-matched");
  updateScore(currentPlayer);
  checkGameEnd(boardEl, theme);
  releaseLock();
}

/**
 * Flips two mismatched cards face-down after a short delay, switches the
 * active player, and releases the board lock.
 * @param first       - The first flipped card.
 * @param second      - The second flipped card.
 * @param releaseLock - Callback that resets state and unlocks the board.
 * @param switchPlayer - Callback that advances the turn to the next player.
 */
function handleMismatch(
  first: HTMLButtonElement,
  second: HTMLButtonElement,
  releaseLock: () => void,
  switchPlayer: () => void,
) {
  setTimeout(() => {
    first.classList.remove("is-flipped");
    second.classList.remove("is-flipped");
    switchPlayer();
    releaseLock();
  }, 1000);
}

/**
 * Returns the `src` of the revealed (back) face image of a card.
 * @param card - The card button element to inspect.
 * @returns The image source string, or undefined if not found.
 */
function getCardImageSrc(card: HTMLButtonElement): string | undefined {
  return card.querySelector<HTMLImageElement>(".card__face--back")?.src;
}

/**
 * Determines whether two flipped cards form a matching pair and delegates
 * to either {@link handleMatch} or {@link handleMismatch} accordingly.
 * @param flipped       - Tuple of the two currently flipped card elements.
 * @param releaseLock   - Callback to reset flipped state and unlock the board.
 * @param switchPlayer  - Callback to advance the turn.
 * @param currentPlayer - The player who flipped the cards.
 * @param boardEl       - The board container element.
 * @param theme         - The active theme name, or null.
 */
function checkPair(
  flipped: HTMLButtonElement[],
  releaseLock: () => void,
  switchPlayer: () => void,
  currentPlayer: Player,
  boardEl: HTMLElement,
  theme: string | null
) {
  const [first, second] = flipped;
  if (getCardImageSrc(first) === getCardImageSrc(second)) {
    handleMatch(first, second, releaseLock, currentPlayer, boardEl, theme);
  } else {
    handleMismatch(first, second, releaseLock, switchPlayer);
  }
}

/**
 * Attaches a delegated click listener to the board that handles card
 * flipping, board locking, and pair-checking logic.
 * @param boardEl     - The board container element.
 * @param theme       - The active theme name, or null.
 * @param startPlayer - The player who takes the first turn.
 */
function attachCardListener(
  boardEl: HTMLElement,
  theme: string | null,
  startPlayer: Player,
) {
  let flipped: HTMLButtonElement[] = [];
  let lockBoard = false;
  let currentPlayer: Player = startPlayer;

  const releaseLock = () => {
    flipped = [];
    lockBoard = false;
  };
  const switchPlayer = () => {
    currentPlayer = getNextPlayer(currentPlayer);
    updatePlayerIndicator(currentPlayer, theme);
  };

  boardEl.addEventListener("click", (e) => {
    if (lockBoard) return;
    const card = (e.target as HTMLElement).closest(
      ".card",
    ) as HTMLButtonElement;
    if (
      !card ||
      card.classList.contains("is-flipped") ||
      card.classList.contains("is-matched")
    )
      return;

    card.classList.add("is-flipped");
    flipped.push(card);
    if (flipped.length === 2) {
      lockBoard = true;
      checkPair(flipped, releaseLock, switchPlayer, currentPlayer, boardEl, theme);
    }
  });
}

/**
 * Clears the board, renders a fresh set of shuffled card pairs for the
 * chosen theme and board size, and attaches interaction logic.
 * @param board - Total number of cards (16 | 24 | 36).
 * @param theme - The active theme name, or null.
 */
function loadBoard(board: number, theme: string | null) {
  const boardEl = document.getElementById("board")!;
  boardEl.innerHTML = "";

  const { array, back, path } = getThemeConfig(theme ?? "Code vibes theme");
  const pairs = getShuffledPairs(array, board / 2);

  pairs.forEach((card) =>
    boardEl.appendChild(createCard(path + back, path + card)),
  );
  setGridLayout(boardEl, board);

  const startPlayer =
    (sessionStorage.getItem("player")?.toLowerCase() as Player) ?? "blue";
  attachCardListener(boardEl, theme, startPlayer);
}

/**
 * Reads the current scores from the DOM and returns the winning player,
 * or "tie" if both scores are equal.
 * @returns The winning {@link Player}, or `"tie"`.
 */
function getWinner(): GameResult {
  const blueScore = parseInt(document.getElementById("score_blue")!.textContent || "0");
  const orangeScore = parseInt(document.getElementById("score_orange")!.textContent || "0");
  if (blueScore === orangeScore) return "tie";
  return blueScore > orangeScore ? "blue" : "orange";
}

/**
 * Copies the final scores from the in-game score display into the
 * end-screen summary elements.
 */
function populateEndScreen() {
  const blueScore = document.getElementById("score_blue")!.textContent || "0";
  const orangeScore =
    document.getElementById("score_orange")!.textContent || "0";
    document.getElementById("endscore_blue")!.textContent = blueScore;
    document.getElementById("endscore_orange")!.textContent = orangeScore;
}

/**
 * Populates the win-screen heading and player image based on the
 * game result.
 * @param winner - The winning player, or `"tie"`.
 * @param theme  - The active theme name, or null.
 */
function populateWinScreen(winner: GameResult, theme: string | null) {
  const h1 = document.querySelector("#win_screen h1")!;
  const img = document.querySelector("#win_screen .winner") as HTMLImageElement;

  if (winner === "tie") {
    h1.textContent = "It's a Tie!";
    h1.className = "";
    img.src = `./public/chess_white.svg`;
    return;
  }

  h1.textContent = `${winner.charAt(0).toUpperCase() + winner.slice(1)} Player`;
  h1.className = "";
  if (theme === "Code vibes theme") h1.classList.add(winner);
  img.src = `./public/chess_${winner}.svg`;
}

/**
 * Slides the end-screen overlay into view with a CSS transition.
 */
function showEnd() {
  let endRef = document.getElementById("end_screen");
  if (endRef) {
    endRef.style.top = "0";
    endRef.style.transition = "ease-in 0.5s";
  }
}

/**
 * Slides the win-screen overlay into view with a CSS transition.
 */
function showWin() {
  let winRef = document.getElementById("win_screen");
  if (winRef) {
    winRef.style.top = "0";
    winRef.style.transition = "ease-in 0.5s";
  }
}

/**
 * Checks whether all cards on the board have been matched. If so,
 * reveals the end screen and schedules the win screen after a delay.
 * @param boardEl - The board container element.
 * @param theme   - The active theme name, or null.
 */
function checkGameEnd(boardEl: HTMLElement, theme: string | null) {
  const remaining = boardEl.querySelectorAll(".card:not(.is-matched)");
  if (remaining.length > 0) return;
  populateEndScreen();
  showEnd();
  setTimeout(() => {
    populateWinScreen(getWinner(), theme);
    showWin();
  }, 5000);
}

document.getElementById("exit_btn")?.addEventListener("click", openExitDialog);
document.getElementById("bgO")?.addEventListener("click", closeExitDialog);
document.getElementById("back")?.addEventListener("click", closeExitDialog);
document.getElementById("exit")?.addEventListener("click", exitGame);
document.getElementById("restart")?.addEventListener("click", exitGame);

/**
 * Opens the exit confirmation dialog and shows the backdrop overlay.
 */
function openExitDialog() {
  dialog.style.top = "50%";
  bgO.style.display = "flex";
}

/**
 * Closes the exit confirmation dialog and hides the backdrop overlay.
 */
function closeExitDialog() {
  if (theme === "Code vibes theme") {
    dialog.style.top = "-50%";
  } else dialog.style.top = "150%";
  bgO.style.display = "none";
}

/**
 * Navigates the user back to the settings page.
 */
function exitGame() {
  window.location.href = "/dist/settings.html";
}

/**
 * Entry point — loads the theme, initialises UI elements, sets the
 * starting player indicator, and renders the game board.
 */
function onInit() {
  loadTheme(theme);
  loadThemeObjects(theme);
  const startPlayer = (player?.toLowerCase() as Player) ?? "blue";
  updatePlayerIndicator(startPlayer, theme);
  loadBoard(board, theme);
}

onInit();
