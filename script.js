// Find the elements using their ID and give them a name to refer to.
const questInput = document.querySelector("#quest-input");
const questButton = document.querySelector("#set-quest-button");
const currentQuest = document.querySelector("#current-quest");
const completeQuestButton = document.querySelector("#complete-quest-button");
const starCount = document.querySelector("#star-count");
const arcadeRank = document.querySelector("#arcade-rank");
const startFocusButton = document.querySelector("#start-focus-button");
const focusTimer = document.querySelector("#focus-timer");
const endFocusDialog = document.querySelector("#end-focus-dialog");
const endFocusDialogButton = document.querySelector("#end-focus-dialog-button");
const selectFocusDuration = document.querySelector("#select-focus-duration");
const pauseFocusButton = document.querySelector("#pause-focus-button");
const endSessionButton = document.querySelector("#end-session-button");
const starEarnedDialog = document.querySelector("#star-earned-dialog");
const starEarnedDialogButton = document.querySelector(
  "#star-earned-dialog-button",
);
const activeQuestReminderDialog = document.querySelector(
  "#active-quest-reminder",
);
const activeQuestReminderDialogButton = document.querySelector(
  "#quest-reminder-dialog-button",
);
const activeQuestReminderDialogText = document.querySelector(
  "#quest-reminder-text",
);
const completedQuestsList = document.querySelector("#completed-quests-list");
const replaceQuestDialog = document.querySelector("#replace-quest-dialog");
const replaceQuestDialogKeepButton = document.querySelector(
  "#replace-quest-dialog-keep-button",
);
const replaceQuestDialogReplaceButton = document.querySelector(
  "#replace-quest-dialog-replace-button",
);

// We use let because these values will change. (These let variables are state in Vanilla JS)
let completedQuests = [];

let isQuestReminderWaiting = false;

let isNewSession = true;

let focusIntervalId = null;

let remainingSeconds = 10;

let remainingMilliseconds = 0;

const savedRemainingMilliseconds = localStorage.getItem(
  "remainingMilliseconds",
);

const savedCompletedQuests = localStorage.getItem("completedQuests");

if (savedCompletedQuests !== null) {
  completedQuests = JSON.parse(savedCompletedQuests);
  renderCompletedQuests();
}

// Displays a list of the completed quests
function renderCompletedQuests() {
  completedQuestsList.textContent = "";

  const completedQuestsListItems = completedQuests.map((quest) => {
    const li = document.createElement("li");
    li.textContent = quest;
    return li;
  });

  completedQuestsList.append(...completedQuestsListItems);
}

const savedSelectedFocusDuration = localStorage.getItem(
  "selectedFocusDuration",
);

// Allows to retrieve the saved Selected Focus Duration in local storage, to be shown on the dropdown when the page reloads
if (savedSelectedFocusDuration !== null) {
  selectFocusDuration.value = savedSelectedFocusDuration;
}

const savedSessionStatus = localStorage.getItem("sessionStatus");

const savedPlannedFinishTime = localStorage.getItem("plannedFinishTime");
let plannedFinishTime = null;

if (savedPlannedFinishTime !== null) {
  plannedFinishTime = savedPlannedFinishTime;
}

// Handles page reload when the session is running
if (savedSessionStatus === "running") {
  remainingMilliseconds = plannedFinishTime - Date.now();
  remainingSeconds = remainingMilliseconds / 1000;
  isNewSession = false;
  if (remainingMilliseconds <= 0) {
    remainingMilliseconds = 0;
    remainingSeconds = remainingMilliseconds / 1000;
    focusTimer.textContent = formatFocusTimer(Math.ceil(remainingSeconds));
    finishFocusSession();
  } else {
    startFocus();
  }
}

// Handles page reload when the session is paussed
if (savedSessionStatus === "paused") {
  isNewSession = false;
  endSessionButton.disabled = false;
  selectFocusDuration.disabled = true;
  startFocusButton.textContent = "Resume focus";
  clearInterval(focusIntervalId);
  remainingMilliseconds = Number(savedRemainingMilliseconds);
  remainingSeconds = remainingMilliseconds / 1000;
  focusTimer.textContent = formatFocusTimer(Math.ceil(remainingSeconds));
}

// Handles page reload when the session is idle (session ended)
if (savedSessionStatus === "idle") {
  let displayFocusDuration = null;

  if (savedSelectedFocusDuration !== null) {
    displayFocusDuration = formatFocusTimer(Number(savedSelectedFocusDuration));
  } else {
    displayFocusDuration = formatFocusTimer(Number(selectFocusDuration.value));
  }
  endSession();
  focusTimer.textContent = displayFocusDuration;
}

// Retrieve the active quest saved in local storage when the page reloads
const savedActiveQuest = localStorage.getItem("activeQuest");
let activeQuest = "";

if (savedActiveQuest !== null) {
  activeQuest = savedActiveQuest;
  activeQuestReminderDialogText.textContent += " " + activeQuest;

  if (!endFocusDialog.open) {
    activeQuestReminderDialog.showModal();
  } else {
    isQuestReminderWaiting = true;
  }
}

if (activeQuest !== "") {
  currentQuest.textContent = activeQuest;
  completeQuestButton.disabled = false;
}

// Retrieve the stars saved in localStorage (these stars survive refreshes), and loads them when the page reloads. NOTE: localStorage stores text so the values need to be converted so adding 1 works as expected.
const savedStars = localStorage.getItem("stars");
let stars = 0;

if (savedStars !== null) {
  stars = Number(savedStars);
}

starCount.textContent = stars;

calculateArcadeRank();

// Determines the rules to assign a rank based on the stars owned.
function calculateArcadeRank() {
  if (stars >= 0 && stars <= 4) {
    arcadeRank.textContent = "Quest Starter";
  } else if (stars >= 5 && stars <= 19) {
    arcadeRank.textContent = "Star Scout";
  } else {
    arcadeRank.textContent = "Arcade Hero";
  }
}

// Change the text of current quest, to the text typed in the input.
function setQuest() {
  const questText = questInput.value.trim();

  if (questText === "") {
    return;
  }

  if (activeQuest !== "") {
    replaceQuestDialog.showModal();
    return;
  }

  saveQuest(questText);
}

function saveQuest(questText) {
  activeQuest = questText;
  currentQuest.textContent = activeQuest;
  localStorage.setItem("activeQuest", activeQuest);

  questInput.value = "";

  completeQuestButton.disabled = false;
}

// Complete the quest and add a start to the counter.
function completeQuest() {
  if (activeQuest === "") {
    return;
  }

  stars = stars + 1;
  starCount.textContent = stars;
  localStorage.setItem("stars", stars);
  calculateArcadeRank();

  completedQuests.push(activeQuest);
  localStorage.setItem("completedQuests", JSON.stringify(completedQuests));
  renderCompletedQuests();
  activeQuest = "";
  currentQuest.textContent = "None yet";
  localStorage.removeItem("activeQuest");
  completeQuestButton.disabled = true;
  starEarnedDialog.showModal();
}

// On each check (setInterval call), we calculate the time left from plannedFinishTime and the current clock. We then use that result (the subtraction of that) to replace remainingSeconds
function decreaseFocusTimer() {
  const millisecondsLeft = plannedFinishTime - Date.now();
  // Math.ceil(...)  rounds up
  // Converts millisenconds to seconds
  const secondsLeft = Math.ceil(millisecondsLeft / 1000);

  // OLD METHOD USED BEFORE the plannedFinishTime and the current clock check:
  // setInterval(...) is called when you click Start, but the browser may run a scheduled call to decreaseFocusTimer later than requested—for example, if the tab is in the background or the browser is busy. This is why this method of substracting 1 is not realiable, since it may result in a time left that is out of sync with the real clock, so the supposed ending time can be a later time than expected.
  // if (remainingSeconds > 0) {
  //   remainingSeconds = remainingSeconds - 1;
  // }

  // This ensure we never show a negative number (that may happen when this function is called later than the plannedFinishTime by the browser)
  if (secondsLeft < 0) {
    remainingSeconds = 0;
  } else remainingSeconds = secondsLeft;

  if (remainingSeconds === 0) {
    clearInterval(focusIntervalId);
    finishFocusSession();
  }

  focusTimer.textContent = formatFocusTimer(remainingSeconds);
}

// Calls the decreaseFocusTimer each second that passes by. Shows the selected focus duration in the displayed timer. (This function is called once the Start Focus button is clicked.)
function startFocus() {
  localStorage.setItem("sessionStatus", "running");
  focusIntervalId = setInterval(decreaseFocusTimer, 1000);

  startFocusButton.disabled = true;

  if (isNewSession) {
    remainingSeconds = Number(selectFocusDuration.value);
  } else {
    remainingSeconds = remainingMilliseconds / 1000;
  }

  // Date.now() gives the current time as a number of milliseconds, so remainingSeconds must be converted to that.
  plannedFinishTime = Date.now() + remainingSeconds * 1000;
  localStorage.setItem("plannedFinishTime", plannedFinishTime);

  focusTimer.textContent = formatFocusTimer(Math.ceil(remainingSeconds));
  pauseFocusButton.disabled = false;
  startFocusButton.textContent = "Start focus";
  selectFocusDuration.disabled = true;
  endSessionButton.disabled = false;
}

// Formats the timer to be shown in the screen in a format of 00:00
function formatFocusTimer(seconds) {
  // Math.floor(...) rounds down
  let wholeMinutes = Math.floor(seconds / 60);

  let leftoverSeconds = seconds % 60;

  if (wholeMinutes < 10) {
    wholeMinutes = `0${wholeMinutes}`;
  }

  if (leftoverSeconds < 10) {
    leftoverSeconds = `0${leftoverSeconds}`;
  }

  const formattedTime = `${wholeMinutes}:${leftoverSeconds}`;

  return formattedTime;
}

// Closes the end focus Dialog
function closeEndFocusDialog() {
  endFocusDialog.close();
}

// After the end focus dialog closes (by clicking its close button or pressing ESC) it checks if the active quest reminder dialog is waiting, if so, shows it.
function handleEndFocusDialogClose() {
  if (isQuestReminderWaiting) {
    activeQuestReminderDialog.showModal();
    isQuestReminderWaiting = false;
  }
}

// Closes the star earned dialog
function closeStarEarnedDialog() {
  starEarnedDialog.close();
}

function closeActiveQuestReminderDialog() {
  activeQuestReminderDialog.close();
}

// Pauses the focus timer. If the time left is negative at the moment we pause, the value becomes zero and the session is ended.
function pauseFocus() {
  localStorage.setItem("sessionStatus", "paused");
  remainingMilliseconds = plannedFinishTime - Date.now();

  if (remainingMilliseconds <= 0) {
    remainingMilliseconds = 0;
    remainingSeconds = remainingMilliseconds / 1000;
    focusTimer.textContent = formatFocusTimer(Math.ceil(remainingSeconds));
    startFocusButton.textContent = "Start focus";
    finishFocusSession();
  } else {
    startFocusButton.textContent = "Resume focus";
    isNewSession = false;
    localStorage.setItem("remainingMilliseconds", remainingMilliseconds);
  }

  clearInterval(focusIntervalId);
  pauseFocusButton.disabled = true;
  startFocusButton.disabled = false;
}

// Ends the current's session timer and leaves the app ready to start a new session, when the End Session button is clicked
function endSession() {
  localStorage.setItem("sessionStatus", "idle");
  clearInterval(focusIntervalId);
  remainingSeconds = 0;
  selectFocusDuration.disabled = false;
  endSessionButton.disabled = true;
  pauseFocusButton.disabled = true;
  startFocusButton.disabled = false;
  startFocusButton.textContent = "Start focus";
  isNewSession = true;
  localStorage.removeItem("plannedFinishTime");

  focusTimer.textContent = formatFocusTimer(remainingSeconds);
}

// When selecting an option from  the Focus Duration dropdown, displays on the timer the chosen option.
function changeFocusDuration() {
  remainingSeconds = Number(selectFocusDuration.value);
  localStorage.setItem("selectedFocusDuration", remainingSeconds);

  focusTimer.textContent = formatFocusTimer(remainingSeconds);
}

// Contains the actions needed to finish a focus session
function finishFocusSession() {
  localStorage.setItem("sessionStatus", "idle");
  pauseFocusButton.disabled = true;
  endSessionButton.disabled = true;
  startFocusButton.disabled = false;
  selectFocusDuration.disabled = false;
  endFocusDialog.showModal();
  isNewSession = true;
  localStorage.removeItem("plannedFinishTime");
}

// Validates if the pressed key is Enter, in the quest input,  if so calls setQuest
function handleQuestInputKeydown(event) {
  if (event.key === "Enter") {
    setQuest();
  }
}

// Closes the Replace quest dialog without changing the quest
//NOTE: the close event here calls the handleCloseReplaceQuestDialog handler so we dont need to call it here.
function handleClickKeepQuest() {
  replaceQuestDialog.close();
}

// Replaces the current quest with the new one
function handleClickReplaceQuest() {
  const questText = questInput.value.trim();

  saveQuest(questText);

  replaceQuestDialog.close();
}

// Clears the quest input whenever the Replace quest dialog closes.
function handleCloseReplaceQuestDialog() {
  questInput.value = "";
}

// When clicking the "Set my quest" button, calls the function to change the current quest's text.
questButton.addEventListener("click", setQuest);

// When clicking the "Complete quest" button, calls the function to complete the quest.
completeQuestButton.addEventListener("click", completeQuest);

// When clicking the "Start focus" button, calls the function to calculate the timer's time left from plannedFinishTime and the current clock.
startFocusButton.addEventListener("click", startFocus);

// When clicking close button in the end focus dialog, it closes it.
endFocusDialogButton.addEventListener("click", closeEndFocusDialog);

// When closing the end focus dialog, calls the handler close handler.
endFocusDialog.addEventListener("close", handleEndFocusDialogClose);

// When clicking the "Pause focus" button, stops the timer.
pauseFocusButton.addEventListener("click", pauseFocus);

// When clicking the "End Session" button, ends the current focus session.
endSessionButton.addEventListener("click", endSession);

// When clicking the select focus duration dropdown, updates the displayed timer.
selectFocusDuration.addEventListener("change", changeFocusDuration);

// When clicking the close button in the star earned dialog, closes it.
starEarnedDialogButton.addEventListener("click", closeStarEarnedDialog);

activeQuestReminderDialogButton.addEventListener(
  "click",
  closeActiveQuestReminderDialog,
);

// When pressing Enter in the quest input, calls the handler which calls setQuest function.
questInput.addEventListener("keydown", handleQuestInputKeydown);

// When clicking he Keep Quest button on the replace Quest dialog, it calls the handler that closes the dialog and doesn't change anything.
replaceQuestDialogKeepButton.addEventListener("click", handleClickKeepQuest);

// When clicking Keep Quest button on the replace Quest dialog, it calls the handler that calls the saveQuest function.
replaceQuestDialogReplaceButton.addEventListener(
  "click",
  handleClickReplaceQuest,
);

// When closing the Replace Quest Dialog, calls the handler which cleans the quest input.
replaceQuestDialog.addEventListener("close", handleCloseReplaceQuestDialog);
