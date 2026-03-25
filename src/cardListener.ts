import { getNextPlayer } from "./game";
import { updatePlayerIndicator } from "./theme";
import { checkPair } from "./game";

type Player = "blue" | "orange";

/**
 * Extracts the closest card element from a click event target.
 * @param e - The mouse event triggered by a click.
 * @returns The closest card button element, or null if none was found.
 */
function getClickedCard(e: MouseEvent): HTMLButtonElement {
  return (e.target as HTMLElement).closest(".card") as HTMLButtonElement;
}

/**
 * Checks whether a card is eligible to be flipped.
 * A card is playable if it exists and is neither already flipped nor matched.
 * @param card - The card element to be checked.
 * @returns True if the card can be flipped, false otherwise.
 */
function isCardPlayable(card: HTMLButtonElement): card is HTMLButtonElement {
  return !!card && !card.classList.contains("is-flipped") && !card.classList.contains("is-matched");
}

/**
 * Flips a card face-up, adds it to the flipped state, and triggers
 * pair-checking logic once two cards have been flipped.
 * @param card    - The card element to flip.
 * @param state   - The current game state containing flipped cards, lock status, and active player.
 * @param boardEl - The board container element.
 * @param theme   - The active theme name.
 */
function flipCard(
  card: HTMLButtonElement,
  state: { flipped: HTMLButtonElement[]; lockBoard: boolean; currentPlayer: Player },
  boardEl: HTMLElement,
  theme: string,
): void {
  card.classList.add("is-flipped");
  state.flipped.push(card);
  if (state.flipped.length === 2) {
    state.lockBoard = true;
    const releaseLock = () => { state.flipped = []; state.lockBoard = false; };
    const switchPlayer = () => {
      state.currentPlayer = getNextPlayer(state.currentPlayer);
      updatePlayerIndicator(state.currentPlayer, theme);
    };
    checkPair(state.flipped, releaseLock, switchPlayer, state.currentPlayer, boardEl, theme);
  }
}

/**
 * Handles a click event on the board by validating the clicked card
 * and delegating to the flip logic if the card is playable.
 * @param e       - The mouse event triggered by a click.
 * @param state   - The current game state containing flipped cards, lock status, and active player.
 * @param boardEl - The board container element.
 * @param theme   - The active theme name.
 */
function handleCardClick(
  e: MouseEvent,
  state: { flipped: HTMLButtonElement[]; lockBoard: boolean; currentPlayer: Player },
  boardEl: HTMLElement,
  theme: string,
): void {
  if (state.lockBoard) return;
  const card = getClickedCard(e);
  if (!isCardPlayable(card)) return;
  flipCard(card, state, boardEl, theme);
}

/**
 * Attaches a delegated click listener to the board that manages
 * card flipping, board locking, and turn switching.
 * @param boardEl     - The board container element.
 * @param theme       - The active theme name.
 * @param startPlayer - The player who takes the first turn.
 */
export function attachCardListener(
  boardEl: HTMLElement,
  theme: string,
  startPlayer: Player,
): void {
  const state = { flipped: [] as HTMLButtonElement[], lockBoard: false, currentPlayer: startPlayer };
  boardEl.addEventListener("click", (e) => handleCardClick(e, state, boardEl, theme));
}