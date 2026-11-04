"use strict";

// ================================================
// SORTICUS — CONSTANTS
// ================================================

const STORAGE = {
  profileCompleted: "sorticus.profileCompleted",
  displayName: "sorticus.displayName",
  onboardingStep: "sorticus.onboardingStep"
};

const STEPS = {
  PROFILE: 0,
  HOUSES: 1,
  QUIZ: 2
};

const PAGES = {
  HOME: "index.html",
  HOUSES: "houses.html",
  QUIZ: "quiz.html"
};

// ================================================
// DOM ELEMENTS
// ================================================

// Existing HTML order: Profile, Quiz, Houses
const [setupButton, quizButton, housesButton] =
  document.querySelectorAll(".action-btns button");

const dobInput = document.querySelector("#input-dob");
const firstNameInput = document.querySelector("#input-first-name");
const lastNameInput = document.querySelector("#input-last-name");

const profileDialog = document.querySelector("#dialog-modal");
const profileForm = profileDialog?.querySelector("form");

// ================================================
// ONBOARDING STATE
// ================================================

const getOnboardingStep = () => {
  if (sessionStorage.getItem(STORAGE.profileCompleted) !== "true") {
    return STEPS.PROFILE;
  }

  const savedStep = Number(
    sessionStorage.getItem(STORAGE.onboardingStep)
  );

  // A completed profile should never return to the profile step.
  return savedStep === STEPS.QUIZ
    ? STEPS.QUIZ
    : STEPS.HOUSES;
};

let currentStep = getOnboardingStep();

// ================================================
// ACTIVE BUTTON MANAGEMENT
// ================================================

const updateActionButtons = () => {
  const buttons = [
    {
      element: setupButton,
      step: STEPS.PROFILE,
      inactiveClass: "btn--ghost"
    },
    {
      element: housesButton,
      step: STEPS.HOUSES,
      inactiveClass: "btn--ghost"
    },
    {
      element: quizButton,
      step: STEPS.QUIZ,
      inactiveClass: "btn--accent"
    }
  ];

  buttons.forEach(({ element, step, inactiveClass }) => {
    if (!element) return;

    const isActive = currentStep === step;

    element.classList.remove(
      "btn--primary",
      "btn--accent",
      "btn--ghost"
    );

    element.classList.add(
      isActive ? "btn--primary" : inactiveClass
    );

    element.disabled = !isActive;

    if (isActive) {
      element.setAttribute("aria-current", "step");
      element.removeAttribute("data-tooltip");
    } else {
      element.removeAttribute("aria-current");
      element.setAttribute(
        "data-tooltip",
        "Complete previous step first"
      );
    }
  });
};

// ================================================
// STATE MANAGEMENT
// ================================================

const setOnboardingStep = (step) => {
  currentStep = step;

  sessionStorage.setItem(
    STORAGE.onboardingStep,
    String(step)
  );

  updateActionButtons();
};

// ================================================
// PROFILE VALIDATION
// ================================================

const validateDateOfBirth = () => {
  if (!dobInput) return;

  if (!dobInput.value) {
    dobInput.setCustomValidity("");
    return;
  }

  const selectedDate = new Date(
    `${dobInput.value}T00:00:00`
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  dobInput.setCustomValidity(
    selectedDate > today
      ? "Date of birth cannot be in the future."
      : ""
  );
};

dobInput?.addEventListener("input", validateDateOfBirth);

// ================================================
// PROFILE SUBMISSION
// ================================================

profileForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  validateDateOfBirth();

  if (!profileForm.reportValidity()) return;

  const displayName = [
    firstNameInput.value.trim(),
    lastNameInput.value.trim()
  ].join(" ");

  sessionStorage.setItem(STORAGE.profileCompleted, "true");
  sessionStorage.setItem(STORAGE.displayName, displayName);

  setOnboardingStep(STEPS.HOUSES);

  profileDialog.close();
});

// ================================================
// FOUR HOUSES NAVIGATION
// ================================================

housesButton?.addEventListener("click", () => {
  if (currentStep !== STEPS.HOUSES) return;

  window.location.assign(PAGES.HOUSES);
});

// ================================================
// QUIZ NAVIGATION
// ================================================

quizButton?.addEventListener("click", () => {
  if (currentStep !== STEPS.QUIZ) return;

  window.location.assign(PAGES.QUIZ);
});

// ================================================
// PAGE-AWARE PROGRESSION
// ================================================

const currentPage = window.location.pathname
  .split("/")
  .pop()
  .toLowerCase();

if (
  currentPage === PAGES.HOUSES &&
  sessionStorage.getItem(STORAGE.profileCompleted) === "true" &&
  currentStep === STEPS.HOUSES
) {
  setOnboardingStep(STEPS.QUIZ);
}

// ================================================
// INITIALIZE
// ================================================

updateActionButtons();

// ================================================
// AUDIO INITIALIZATION
// ================================================

const audio = document.getElementById("theme");
let started = false;

function startMusic() {
  if (started || !audio) return;

  started = true;

  audio.play()
    .then(() => {
      ["click", "scroll", "mousemove", "keydown", "touchstart", "wheel"]
        .forEach(eventName =>
          window.removeEventListener(eventName, startMusic)
        );
    })
    .catch(() => {
      started = false;
    });
}

["click", "scroll", "mousemove", "keydown", "touchstart", "wheel"]
  .forEach(eventName =>
    window.addEventListener(eventName, startMusic, { passive: true })
  );

