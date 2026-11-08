/* ==========================================================
   SORTICUS — quiz.js  (quiz.html only)

   Needs main.js and quizData.js loaded BEFORE it:
       <script src="main.js" defer></script>
       <script src="quizData.js" defer></script>
       <script src="quiz.js" defer></script>
   ========================================================== */
(function () {
  "use strict";

  const core = window.Sorticus;
  const data = window.SORTICUS_QUIZ;

  if (!core || !data) {
    console.error("Sorticus quiz: load main.js and quizData.js before quiz.js.");
    return;
  }

  if (core.PAGE !== "quiz") return;

  const { PAGES, isProfileComplete, saveSortedResult } = core;
  const { QUESTIONS_PER_ATTEMPT, HOUSE_TRAITS, QUESTIONS } = data;

  const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"];

  // ==========================================
  // SCORING (pure — no DOM)
  // ==========================================

  const shuffle = (items) => {
    const shuffled = [...items];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  };

  const optionPoints = (option) =>
    Object.values(option.scores).reduce((sum, points) => sum + points, 0);

  // How strong a typical answer is for each house. Raw weights are not equal
  // per house (Gryffindor answers average ~44 points, Ravenclaw ~48, with
  // different spreads), so raw point totals made some houses win far more
  // often. Comparing an answer to its own house's average and spread fixes that.
  const HOUSE_STATS = Object.fromEntries(
    Object.keys(HOUSE_TRAITS).map((house) => {
      const points = QUESTIONS.flatMap((question) =>
        question.options
          .filter((option) => option.house === house)
          .map(optionPoints)
      );

      const mean = points.reduce((a, b) => a + b, 0) / points.length;
      const variance =
        points.reduce((sum, p) => sum + (p - mean) ** 2, 0) / points.length;

      return [house, { mean, deviation: Math.sqrt(variance) }];
    })
  );

  const createScoreboard = () => ({
    picks: Object.fromEntries(Object.keys(HOUSE_TRAITS).map((h) => [h, 0])),
    strength: Object.fromEntries(Object.keys(HOUSE_TRAITS).map((h) => [h, 0])),
    traitScores: Object.fromEntries(
      Object.values(HOUSE_TRAITS).flat().map((trait) => [trait, 0])
    )
  });

  const recordAnswer = (scoreboard, option) => {
    const { mean, deviation } = HOUSE_STATS[option.house];

    scoreboard.picks[option.house] += 1;

    // Standardised: 0 = a typical answer for this house, +1 = a strong one.
    scoreboard.strength[option.house] +=
      deviation > 0 ? (optionPoints(option) - mean) / deviation : 0;

    // Raw trait points are kept as-is for the saved trait_scores.
    for (const [trait, points] of Object.entries(option.scores)) {
      scoreboard.traitScores[trait] = (scoreboard.traitScores[trait] ?? 0) + points;
    }
  };

  const calculateResult = (scoreboard) => {
    const ranked = Object.keys(scoreboard.picks).map((house) => ({
      house,
      picks: scoreboard.picks[house],
      strength: Number(scoreboard.strength[house].toFixed(6))
    }));

    const best = (list, key) => {
      const max = Math.max(...list.map((item) => item[key]));
      return list.filter((item) => item[key] === max);
    };

    // 1) Most answers wins what the student actually chose.
    // 2) A tie goes to the house whose answers were strongest for that house.
    // 3) Only a complete tie is random.
    let finalists = best(ranked, "picks");

    if (finalists.length > 1) finalists = best(finalists, "strength");

    return shuffle(finalists)[0].house;
  };

  // ==========================================
  // DOM REFERENCES
  // ==========================================

  const questionNumber = document.querySelector("#question-number");
  const questionSection = document.querySelector(".question");
  const questionCategory = questionSection?.querySelector(":scope > p");
  const questionHeading = questionSection?.querySelector("h1");
  const questionDescription = questionSection?.querySelector(".description");
  const sortingQuote = document.querySelector(".inquest-quote");

  const optionsGroup = document.querySelector("#options-group");
  const optionCards = [...(optionsGroup?.querySelectorAll(".option-card") ?? [])];

  const nextButton = document.querySelector("#next-btn");
  const progressItems = [...document.querySelectorAll("main > ol li")];

  // Text lives in its own <span>, so it no longer depends on whitespace nodes
  // that a formatter or minifier can move around.
  const ensureSlot = (parent, id, before = null) => {
    let slot = parent.querySelector(`#${id}`);

    if (!slot) {
      slot = document.createElement("span");
      slot.id = id;
      parent.insertBefore(slot, before);
    }

    return slot;
  };

  let categorySlot = null;
  let nextLabelSlot = null;

  const prepareTextSlots = () => {
    if (questionCategory) {
      categorySlot = ensureSlot(questionCategory, "question-category");
    }

    // Remove the loose "Next Question" text, keep the arrow icon.
    [...nextButton.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .forEach((node) => node.remove());

    nextLabelSlot = ensureSlot(nextButton, "next-btn-label", nextButton.firstChild);
  };

  // ==========================================
  // QUIZ STATE
  // ==========================================

  const quizState = {
    questions: [],
    currentIndex: 0,
    selectedOption: null,
    locked: false,
    scoreboard: createScoreboard()
  };

  const createQuiz = () =>
    shuffle(QUESTIONS)
      .slice(0, QUESTIONS_PER_ATTEMPT)
      .map((question) => ({
        ...question,
        options: shuffle(question.options)
      }));

  // ==========================================
  // RENDERING
  // ==========================================

  const renderOptions = (options) => {
    optionCards.forEach((card, index) => {
      const option = options[index];

      const radio = card.querySelector('input[type="radio"]');
      const answerText = card.querySelector('span[role="heading"]');
      const descriptionText = card.querySelector("span.description");

      if (!option || !radio || !answerText || !descriptionText) return;

      const letter = String.fromCharCode(65 + index);

      // The radio value is the option's position, not its house, so the
      // house is no longer visible in the page source.
      card.removeAttribute("data-house");
      card.dataset.text = letter;

      radio.value = String(index);
      radio.dataset.text = letter;
      radio.removeAttribute("onchange");
      radio.checked = false;
      radio.disabled = false;

      answerText.textContent = option.text;
      descriptionText.textContent = option.description;
    });
  };

  const updateProgress = () => {
    const current = quizState.currentIndex;

    if (questionNumber) {
      questionNumber.textContent = ROMAN_NUMERALS[current] ?? String(current + 1);
    }

    progressItems.forEach((item, index) => {
      if (index === current) {
        item.setAttribute("aria-current", "step");
      } else {
        item.removeAttribute("aria-current");
      }

      item.dataset.state =
        index < current ? "completed" :
        index === current ? "current" :
        "upcoming";
    });
  };

  const renderQuestion = ({ announce = false } = {}) => {
    const question = quizState.questions[quizState.currentIndex];

    if (!question) return;

    quizState.selectedOption = null;
    quizState.locked = false;

    if (categorySlot) categorySlot.textContent = ` ${question.category}`;
    questionHeading.textContent = question.question;

    if (questionDescription) questionDescription.textContent = question.description;
    if (sortingQuote) sortingQuote.textContent = question.quote;

    renderOptions(question.options);
    updateProgress();

    nextButton.disabled = true;
    nextLabelSlot.textContent =
      quizState.currentIndex === QUESTIONS_PER_ATTEMPT - 1
        ? "Reveal Result "
        : "Next Question ";

    // Move focus to the new question so screen readers announce the change.
    if (announce) questionHeading.focus({ preventScroll: true });
  };

  // ==========================================
  // ANSWER SELECTION
  // ==========================================

  optionsGroup?.addEventListener("change", (event) => {
    const radio = event.target;

    if (!radio.matches('input[type="radio"][name="sorting-answer"]')) return;

    const question = quizState.questions[quizState.currentIndex];
    const selected = question?.options[Number(radio.value)];

    if (!selected) return;

    quizState.selectedOption = selected;
    nextButton.disabled = false;
  });

  // ==========================================
  // RESULT
  // ==========================================

  const revealResult = () => {
    nextButton.disabled = true;

    const { scoreboard } = quizState;

    const result = {
      house: calculateResult(scoreboard),
      picks: scoreboard.picks,
      traitScores: scoreboard.traitScores,
      allocatedAt: new Date().toISOString()
    };

    saveSortedResult(result);
    window.location.assign(PAGES.PROFILE);
  };

  // ==========================================
  // PROGRESSION
  // ==========================================

  const nextQuestion = () => {
    // "locked" stops a double-click from counting the same answer twice.
    if (!quizState.selectedOption || quizState.locked) return;

    quizState.locked = true;
    recordAnswer(quizState.scoreboard, quizState.selectedOption);

    if (quizState.currentIndex === QUESTIONS_PER_ATTEMPT - 1) {
      revealResult();
      return;
    }

    quizState.currentIndex += 1;
    renderQuestion({ announce: true });
  };

  nextButton?.addEventListener("click", nextQuestion);

  // ==========================================
  // INITIALIZATION
  // ==========================================

  // Catches typos in the question data (it is long and easy to get wrong).
  const validateQuestions = () => {
    const problems = [];

    if (QUESTIONS.length < QUESTIONS_PER_ATTEMPT) {
      problems.push(`Need at least ${QUESTIONS_PER_ATTEMPT} questions.`);
    }

    QUESTIONS.forEach((question, index) => {
      const houses = question.options.map((option) => option.house);

      if (houses.length !== 4 || new Set(houses).size !== 4) {
        problems.push(`Question ${index + 1}: needs exactly one option per house.`);
      }

      question.options.forEach((option) => {
        Object.keys(option.scores).forEach((trait) => {
          if (!HOUSE_TRAITS[option.house]?.includes(trait)) {
            problems.push(
              `Question ${index + 1}: ${option.house} scores "${trait}", which belongs to another house.`
            );
          }
        });
      });
    });

    return problems;
  };

  const initializeQuiz = () => {
    if (!isProfileComplete()) {
      window.location.replace(PAGES.HOME);
      return;
    }

    if (
      !optionsGroup ||
      optionCards.length !== 4 ||
      !questionHeading ||
      !nextButton
    ) {
      console.error("Sorticus Quiz: Required quiz elements were not found.");
      return;
    }

    const problems = validateQuestions();

    if (problems.length) {
      console.error("Sorticus Quiz: invalid question data.\n" + problems.join("\n"));
      return;
    }

    if (progressItems.length !== QUESTIONS_PER_ATTEMPT) {
      console.warn(
        `Sorticus Quiz: found ${progressItems.length} progress items, expected ${QUESTIONS_PER_ATTEMPT}.`
      );
    }

    questionHeading.tabIndex = -1;
    prepareTextSlots();

    quizState.questions = createQuiz();
    renderQuestion();
  };

  initializeQuiz();
})();
