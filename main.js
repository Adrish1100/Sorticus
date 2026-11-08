/* ==========================================================
   SORTICUS — main.js  (load FIRST, on EVERY page)

   Shared settings and helpers, the profile dialog / onboarding
   steps, and the background music. Everything stays on the
   visitor's device (localStorage): name, progress, sorted house.

   Other files read these shared values from window.Sorticus.
   ========================================================== */
(function () {
  "use strict";

  // ======================================================
  // SHARED CONFIG
  // ======================================================
  // ==========================================
  // SORTICUS — SHARED CONFIG
  // Imported by main.js, quiz.js and profile.js.
  // ==========================================

  // ---- Navigation ----
  const PAGES = {
    HOME: "index.html",
    HOUSES: "houses.html",
    QUIZ: "quiz.html",
    PROFILE: "profile.html"
  };

  const STEPS = {
    PROFILE: 0,
    HOUSES: 1,
    QUIZ: 2
  };

  // ---- Storage keys ----
  const STORAGE = {
    profileCompleted: "sorticus.profileCompleted",
    displayName: "sorticus.displayName",
    onboardingStep: "sorticus.onboardingStep",
    sortedResult: "sorticus.sortedResult", // the quiz outcome, kept on this device
    audioTime: "sorticus.audioTime"
  };

  // ---- Houses (single source of truth) ----
  const HOUSES = {
    gryffindor: {
      name: "Gryffindor",
      crest: "Gryffindor-house-logo.jpg",
      motto: "Bravery, courage and determination"
    },
    slytherin: {
      name: "Slytherin",
      crest: "Slytherin-house-logo.jpg",
      motto: "Ambition, cunning and resourcefulness"
    },
    hufflepuff: {
      name: "Hufflepuff",
      crest: "Hufflepuff-house-logo.jpg",
      motto: "Patience, loyalty and fairness"
    },
    ravenclaw: {
      name: "Ravenclaw",
      crest: "Ravenclaw-house-logo.jpg",
      motto: "Wisdom, wit and intellect"
    }
  };

  // ---- Safe storage ----
  // localStorage / sessionStorage can throw (private mode, blocked cookies).
  // Every read and write goes through these wrappers instead.
  const createStore = (getStorage) => {
    const attempt = (action, fallback) => {
      try {
        return action(getStorage());
      } catch {
        return fallback;
      }
    };

    return {
      get: (key) => attempt((s) => s.getItem(key), null),
      set: (key, value) => attempt((s) => (s.setItem(key, value), true), false),
      remove: (key) => attempt((s) => (s.removeItem(key), true), false)
    };
  };

  // Lives as long as the Supabase anonymous session does (same lifetime).
  const localStore = createStore(() => window.localStorage);
  // Per-tab hand-offs (quiz result, audio position).
  const sessionStore = createStore(() => window.sessionStorage);

  const isProfileComplete = () =>
    localStore.get(STORAGE.profileCompleted) === "true";


  // Which page is this? data-page on <body> wins; otherwise the file name
  // in the address (works for /quiz.html and for clean URLs like /quiz).
  const PAGE = (() => {
    const fromAttribute = document.body && document.body.dataset.page;

    if (fromAttribute) return fromAttribute;

    const file = (window.location.pathname.split("/").pop() || "")
      .toLowerCase()
      .replace(/\.html$/, "");

    return { "": "home", index: "home", houses: "houses", quiz: "quiz", profile: "profile" }[file] ?? "";
  })();

  // ---- The sorted result, kept on this device ----
  // sessionStorage is only a fallback for browsers that block localStorage.
  const saveSortedResult = (result) => {
    const json = JSON.stringify(result);

    return (
      localStore.set(STORAGE.sortedResult, json) ||
      sessionStore.set(STORAGE.sortedResult, json)
    );
  };

  const readSortedResult = () => {
    const raw =
      localStore.get(STORAGE.sortedResult) ?? sessionStore.get(STORAGE.sortedResult);

    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return HOUSES[parsed?.house] ? parsed : null;
    } catch {
      return null;
    }
  };

  // What quiz.js and profile.js are allowed to use.
  window.Sorticus = Object.freeze({
    PAGE,
    PAGES,
    STEPS,
    STORAGE,
    HOUSES,
    localStore,
    sessionStore,
    isProfileComplete,
    saveSortedResult,
    readSortedResult
  });

  // ======================================================
  // ONBOARDING + MUSIC
  // ======================================================
  {
    // ==========================================
    // SORTICUS — SITE-WIDE: ONBOARDING + AUDIO
    // Loaded on every page. Needs <body data-page="home|houses|quiz|profile">.
    // ==========================================


    const page = PAGE;

    // ==========================================
    // ONBOARDING STATE
    // ==========================================

    const getStep = () => {
      if (!isProfileComplete()) return STEPS.PROFILE;

      // A completed profile never returns to the profile step.
      return Number(localStore.get(STORAGE.onboardingStep)) === STEPS.QUIZ
        ? STEPS.QUIZ
        : STEPS.HOUSES;
    };

    let currentStep = getStep();

    // Buttons are found by id, not by their position in the DOM.
    const stepButtons = [
      { step: STEPS.PROFILE, selector: "#setup-profile", inactiveClass: "btn--ghost" },
      { step: STEPS.HOUSES, selector: "#explore-houses", inactiveClass: "btn--ghost" },
      { step: STEPS.QUIZ, selector: "#take-quiz", inactiveClass: "btn--accent" }
    ].map((item) => ({ ...item, element: document.querySelector(item.selector) }));

    const destinations = {
      [STEPS.HOUSES]: PAGES.HOUSES,
      [STEPS.QUIZ]: PAGES.QUIZ
    };

    const renderStepButtons = () => {
      stepButtons.forEach(({ element, step, inactiveClass }) => {
        if (!element) return;

        const isActive = currentStep === step;

        element.classList.remove("btn--primary", "btn--accent", "btn--ghost");
        element.classList.add(isActive ? "btn--primary" : inactiveClass);
        element.disabled = !isActive;

        if (isActive) {
          element.setAttribute("aria-current", "step");
          element.removeAttribute("data-tooltip");
        } else {
          element.removeAttribute("aria-current");
          element.setAttribute("data-tooltip", "Complete previous step first");
        }
      });
    };

    const setStep = (step) => {
      currentStep = step;
      localStore.set(STORAGE.onboardingStep, String(step));
      renderStepButtons();
    };

    // ==========================================
    // PROFILE DIALOG (index.html)
    // ==========================================

    const initProfileDialog = () => {
      const dialog = document.querySelector("#dialog-modal");
      const form = dialog?.querySelector("form");

      if (!dialog || !form) return;

      const dobInput = form.querySelector("#input-dob");
      const firstNameInput = form.querySelector("#input-first-name");
      const lastNameInput = form.querySelector("#input-last-name");

      const validateDateOfBirth = () => {
        if (!dobInput) return;

        if (!dobInput.value) {
          dobInput.setCustomValidity("");
          return;
        }

        const selected = new Date(`${dobInput.value}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        dobInput.setCustomValidity(
          selected > today ? "Date of birth cannot be in the future." : ""
        );
      };

      dobInput?.addEventListener("input", validateDateOfBirth);
      form.addEventListener("reset", () => dobInput?.setCustomValidity(""));

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        validateDateOfBirth();

        if (!form.reportValidity()) return;

        const displayName =
          `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`.trim();

        localStore.set(STORAGE.profileCompleted, "true");
        localStore.set(STORAGE.displayName, displayName);


        setStep(STEPS.HOUSES);
        dialog.close();
      });

      // Browsers without the Invoker Commands API (command / commandfor)
      // would otherwise have no way to open or close the dialog.
      if (!("commandForElement" in HTMLButtonElement.prototype)) {
        stepButtons
          .find(({ step }) => step === STEPS.PROFILE)
          ?.element?.addEventListener("click", () => dialog.showModal());

        dialog
          .querySelector(".close-dialog")
          ?.addEventListener("click", () => dialog.close());
      }
    };

    // ==========================================
    // STEP NAVIGATION
    // ==========================================

    const initStepNavigation = () => {
      stepButtons.forEach(({ element, step }) => {
        const destination = destinations[step];

        if (!element || !destination) return;

        element.addEventListener("click", () => {
          if (currentStep === step) window.location.assign(destination);
        });
      });

      // Visiting the houses page unlocks the quiz.
      if (page === "houses" && currentStep === STEPS.HOUSES) {
        setStep(STEPS.QUIZ);
      }
    };

    // ==========================================
    // BACKGROUND MUSIC
    // ==========================================

    // Only real user gestures count for autoplay. mousemove, scroll and wheel
    // do not, so listening to them just makes play() fail over and over.
    const ACTIVATION_EVENTS = ["pointerdown", "keydown"];

    const initAudio = () => {
      const audio = document.getElementById("theme");

      if (!audio) return;

      // Pick the track up roughly where the previous page left it.
      const savedTime = Number(sessionStore.get(STORAGE.audioTime));

      const restorePosition = () => {
        if (savedTime > 0 && savedTime < audio.duration) {
          audio.currentTime = savedTime;
        }
      };

      if (audio.readyState >= 1) {
        restorePosition();
      } else {
        audio.addEventListener("loadedmetadata", restorePosition, { once: true });
      }

      window.addEventListener("pagehide", () => {
        sessionStore.set(STORAGE.audioTime, String(audio.currentTime));
      });

      let starting = false;

      const start = async () => {
        if (starting) return;
        starting = true;

        try {
          await audio.play();
          ACTIVATION_EVENTS.forEach((name) =>
            window.removeEventListener(name, start)
          );
        } catch {
          // Still blocked: keep waiting for the next real gesture.
        } finally {
          starting = false;
        }
      };

      ACTIVATION_EVENTS.forEach((name) =>
        window.addEventListener(name, start, { passive: true })
      );

      // Browsers that remember earlier interaction allow this straight away,
      // which keeps the music going across page changes.
      start();
    };

    // ==========================================
    // INITIALIZE
    // ==========================================

    initProfileDialog();
    initStepNavigation();
    renderStepButtons();
    initAudio();

  }
})();
