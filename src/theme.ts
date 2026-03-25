type Player = "blue" | "orange";

/**
 * Loads the theme-specific stylesheet dynamically via code splitting.
 * @param theme - The name of the selected theme.
 */
export function loadTheme(theme: string): void {
  if (theme === "Code vibes theme") {
    import("./styles/themes/code.scss");
  } else if (theme === "Foods theme") {
    import("./styles/themes/foods.scss");
  }
}

/**
 * Updates UI elements (images, labels) to match the Code vibes theme.
 */
function returnCodeObjects(): void {
  (document.getElementById("player_blue") as HTMLImageElement).src = "/label_blue.svg";
  (document.getElementById("player_orange") as HTMLImageElement).src = "/label_orange.svg";
  (document.getElementById("exit_icon") as HTMLImageElement).src = "/exit.svg";
  (document.getElementById("restart") as HTMLElement).innerHTML = "Back to start";
}

/**
 * Updates UI elements (images, labels) to match the Foods theme.
 */
function returnFoodObjects(): void {
  (document.getElementById("player_blue") as HTMLImageElement).src = "/chess_blue.svg";
  (document.getElementById("player_orange") as HTMLImageElement).src = "/chess_orange.svg";
  (document.getElementById("exit_icon") as HTMLImageElement).src = "/exit_orange.svg";
  (document.getElementById("restart") as HTMLElement).innerHTML = "Home";
}

/**
 * Delegates to the appropriate theme-specific UI update function.
 * @param theme - The active theme name.
 */
export function loadThemeObjects(theme: string): void {
  if (theme === "Code vibes theme") {
    returnCodeObjects();
  } else if (theme === "Foods theme") {
    returnFoodObjects();
  }
}

/**
 * Updates the current-player indicator image to reflect whose turn it is.
 * @param player - The player now taking their turn.
 * @param theme  - The active theme name.
 */
export function updatePlayerIndicator(player: Player, theme: string): void {
  const el = document.getElementById("currentPlayer") as HTMLImageElement;
  const p = player.toLowerCase() as Player;
  if (theme === "Code vibes theme") {
    el.src = `/label_${p}.svg`;
    el.style.backgroundColor = "";
  } else if (theme === "Foods theme") {
    el.src = "/chess_white.svg";
    el.style.backgroundColor = p === "blue" ? "#2bb1ff" : "#f58e39";
  }
}