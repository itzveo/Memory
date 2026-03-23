import './styles/pages/settings.scss';
import './styles/style.scss';

const state: { theme: string | null; player: string | null; board: number | null } = {
  theme: null,
  player: null,
  board: null,
};

const errorEl = document.getElementById("settingsError")!;
const themeValue = document.getElementById("themeValue")!;
const playerValue = document.getElementById("playerValue")!;
const boardValue = document.getElementById("boardValue")!;
const previewImg = document.getElementById("themePreview") as HTMLImageElement;

const settingsBlocks = document.querySelectorAll(".settings");

const startBtn = document.getElementById("start")!;

startBtn.addEventListener("click", () => {
  if (!isStateComplete()) {
    errorEl.textContent = "Bitte Theme / Player / Board size auswählen.";
    return;
  }
  sessionStorage.setItem("theme", state.theme!);
  sessionStorage.setItem("player", state.player!);
  sessionStorage.setItem("board", state.board!.toString());
  window.location.href = "game.html";
});

/**
 * Checks whether all three required settings (theme, player, board)
 * have been selected by the user.
 * @returns `true` if the state is fully populated, `false` otherwise.
 */
function isStateComplete() {
  return state.theme !== null && state.player !== null && state.board !== null;
}

/**
 * Syncs the settings summary labels in the UI with the current state.
 * Displays fallback placeholder text for any value not yet selected.
 * Clears the error message once all settings are complete.
 */
function updateUI() {
  themeValue.textContent = state.theme ?? "Theme";
  playerValue.textContent = state.player ?? "Player";
  boardValue.textContent = state.board?.toString() ?? "Board size";
  errorEl.textContent = isStateComplete() ? "" : errorEl.textContent;
}

/**
 * Updates the theme preview image when a theme option is focused.
 * Reads the preview image path from the option's `data-preview` attribute.
 * @param option - The theme option element that was hovered or clicked.
 */
function handleTheme(option: Element) {
    const preview = option.getAttribute("data-preview");
    if (preview)previewImg.src = preview;
}

/**
 * Handles the selection of a settings option. Marks the clicked option
 * as active, updates the corresponding state field, and refreshes the UI.
 * For theme options, also triggers the preview image update.
 * @param option      - The option element that was clicked.
 * @param options     - All sibling option elements in the same settings block.
 * @param settingType - The type of setting being changed (`"theme"` | `"player"` | `"board"`), or null.
 */
function handleOptionClick(option: Element, options: NodeListOf<Element>, settingType: string | null) {
    options.forEach(opt => opt.classList.remove("active"));
    option.classList.add("active");

    const text = option.querySelector("span")?.textContent || "";

    if (settingType === "theme") { state.theme = text; handleTheme(option); }
    if (settingType === "player") state.player = text;
    if (settingType === "board") state.board = parseInt(text.replace(/\D/g, ""), 10);

    updateUI();
}

/**
 * Initialises a single settings block by attaching click listeners to
 * each option. For theme blocks, also attaches `mouseenter` and
 * `mouseleave` listeners so hovering previews the theme image and
 * restoring the active selection on mouse leave.
 * @param block - The settings block container element.
 */
function initSettingsBlock(block: Element) {
    const options = block.querySelectorAll(".option");
    const settingType = block.getAttribute("data-setting");

    options.forEach(option => {
        option.addEventListener("click", () => handleOptionClick(option, options, settingType));

    if (settingType === "theme") {
            option.addEventListener("mouseenter", () => handleTheme(option));

            option.addEventListener("mouseleave", () => {
                const activeOption = block.querySelector(".option.active");
                if (activeOption) handleTheme(activeOption);
            });
        }
    });
}

settingsBlocks.forEach(block => initSettingsBlock(block));

updateUI();