
"use strict";

// ==========================================
// SORTICUS — QUIZ ENGINE
// ==========================================

const QUESTIONS_PER_ATTEMPT = 7;

const HOUSE_TRAITS = {
  gryffindor: ["bravery", "courage", "honor"],
  slytherin: ["ambition", "cunning", "strategy"],
  hufflepuff: ["loyalty", "patience", "fairness"],
  ravenclaw: ["wisdom", "wit", "intellect"]
};

const ROMAN_NUMERALS = [
  "I", "II", "III", "IV", "V", "VI", "VII"
];

// ==========================================
// QUESTION BANK — 14 QUESTIONS
// ==========================================

const QUESTIONS = [
  {
    category: "Instinctual Reflex Test",
    question: "When faced with imminent magical danger, your first instinct is to:",
    description: "Cast aside premeditated doctrine. Select the response that speaks unconditionally to your raw impulse.",
    quote: "A quiet resolve or a roaring fire within? Let us look deep into your soul.",
    options: [
      {
        house: "gryffindor",
        text: "Draw your wand and step boldly into danger to shield others.",
        description: "Hesitation breeds ruin. Valor requires courage when others need protection.",
        scores: { bravery: 18, courage: 15, honor: 8 }
      },
      {
        house: "slytherin",
        text: "Assess the situation, seeking the strategic flaw that turns the tide.",
        description: "Power manifests through cunning repositioning and sharpened wit.",
        scores: { ambition: 18, cunning: 15, strategy: 10 }
      },
      {
        house: "hufflepuff",
        text: "Form an unbreakable circle with your companions.",
        description: "True resilience lies in solidarity. No one should be left behind.",
        scores: { loyalty: 20, fairness: 12, patience: 10 }
      },
      {
        house: "ravenclaw",
        text: "Analyze the situation and deduce the most logical countermeasure.",
        description: "Chaos yields to scholastic logic. Understanding precedes action.",
        scores: { wisdom: 18, wit: 14, intellect: 10 }
      }
    ]
  },
  {
    category: "The Forbidden Passage",
    question: "You discover a mysterious passage that nobody has entered for centuries. What do you do?",
    description: "Curiosity and caution often lead to very different destinations.",
    quote: "Some doors are locked for a reason. Others await someone clever enough to open them.",
    options: [
      {
        house: "gryffindor",
        text: "Enter immediately, prepared to face whatever awaits.",
        description: "Fear should never be allowed to dictate every decision.",
        scores: { bravery: 18, courage: 15, honor: 8 }
      },
      {
        house: "slytherin",
        text: "Investigate its potential advantages before committing.",
        description: "An opportunity is valuable only when its risks are understood.",
        scores: { ambition: 18, cunning: 15, strategy: 10 }
      },
      {
        house: "hufflepuff",
        text: "Find companions and explore together.",
        description: "Shared discoveries are better than solitary achievements.",
        scores: { loyalty: 20, patience: 12, fairness: 10 }
      },
      {
        house: "ravenclaw",
        text: "Study its inscriptions and uncover its history first.",
        description: "Knowledge can reveal what courage alone might overlook.",
        scores: { wisdom: 18, wit: 14, intellect: 10 }
      }
    ]
  },
  {
    category: "The Unwritten Rule",
    question: "You discover that a respected school rule is based on a misunderstanding. What is your response?",
    description: "Your principles are tested when tradition conflicts with reason.",
    quote: "Tradition may guide the present, but should it always govern the future?",
    options: [
      {
        house: "gryffindor",
        text: "Challenge the rule openly, even if it creates opposition.",
        description: "An unjust rule deserves to be questioned without hesitation.",
        scores: { bravery: 16, courage: 15, honor: 10 }
      },
      {
        house: "slytherin",
        text: "Find an effective way to change it without losing influence.",
        description: "A carefully planned change can accomplish more than confrontation.",
        scores: { ambition: 18, cunning: 14, strategy: 12 }
      },
      {
        house: "hufflepuff",
        text: "Gather those affected and present their concerns together.",
        description: "Fairness requires listening to everyone involved.",
        scores: { loyalty: 16, patience: 12, fairness: 18 }
      },
      {
        house: "ravenclaw",
        text: "Collect evidence and construct a logical argument.",
        description: "A well-supported truth is difficult to dismiss.",
        scores: { wisdom: 18, wit: 12, intellect: 16 }
      }
    ]
  },
  {
    category: "The Ancient Artifact",
    question: "An ancient magical artifact offers extraordinary power, but its purpose is unknown. What interests you most?",
    description: "Consider what you value when faced with something extraordinary.",
    quote: "Power, purpose, friendship, or understanding? Every choice reveals something.",
    options: [
      {
        house: "gryffindor",
        text: "Whether it could protect people from danger.",
        description: "Strength is meaningful when used to defend others.",
        scores: { bravery: 15, courage: 12, honor: 16 }
      },
      {
        house: "slytherin",
        text: "The possibilities it could unlock for your ambitions.",
        description: "Potential is worth exploring when guided by determination.",
        scores: { ambition: 20, cunning: 12, strategy: 14 }
      },
      {
        house: "hufflepuff",
        text: "Whether it could improve life for the wider community.",
        description: "The greatest achievement benefits more than its possessor.",
        scores: { loyalty: 16, patience: 12, fairness: 18 }
      },
      {
        house: "ravenclaw",
        text: "The secrets and knowledge hidden within its design.",
        description: "Understanding the unknown is a reward in itself.",
        scores: { wisdom: 18, wit: 12, intellect: 18 }
      }
    ]
  },
  {
    category: "The Difficult Decision",
    question: "Two important responsibilities demand your attention at the same time. How do you decide?",
    description: "Pressure reveals the principles behind your priorities.",
    quote: "There is rarely a perfect answer. There is always a choice to make.",
    options: [
      {
        house: "gryffindor",
        text: "Handle the situation where someone faces the greatest immediate danger.",
        description: "The moment calls for decisive action and courage.",
        scores: { bravery: 18, courage: 16, honor: 8 }
      },
      {
        house: "slytherin",
        text: "Choose the action that produces the strongest long-term outcome.",
        description: "A strategic decision considers consequences beyond the present.",
        scores: { ambition: 16, cunning: 12, strategy: 18 }
      },
      {
        house: "hufflepuff",
        text: "Find a fair arrangement that does not abandon either responsibility.",
        description: "Commitment means taking every responsibility seriously.",
        scores: { loyalty: 18, patience: 16, fairness: 12 }
      },
      {
        house: "ravenclaw",
        text: "Evaluate the facts before deciding which needs attention first.",
        description: "Clear reasoning prevents unnecessary mistakes.",
        scores: { wisdom: 16, wit: 12, intellect: 18 }
      }
    ]
  },
  {
    category: "The Meaning of Success",
    question: "Which achievement would make you feel most fulfilled?",
    description: "There are many definitions of success. Which one resonates with you?",
    quote: "The destination matters, but the reason for reaching it matters more.",
    options: [
      {
        house: "gryffindor",
        text: "Standing up for something important despite opposition.",
        description: "Success means remaining courageous when it matters.",
        scores: { bravery: 18, courage: 18, honor: 12 }
      },
      {
        house: "slytherin",
        text: "Achieving a difficult goal through determination and planning.",
        description: "Success is the result of ambition supported by action.",
        scores: { ambition: 20, cunning: 12, strategy: 14 }
      },
      {
        house: "hufflepuff",
        text: "Building something meaningful with people you trust.",
        description: "Achievement becomes richer when shared with others.",
        scores: { loyalty: 18, patience: 14, fairness: 14 }
      },
      {
        house: "ravenclaw",
        text: "Discovering something new that changes how people understand the world.",
        description: "Knowledge and discovery can be achievements of their own.",
        scores: { wisdom: 18, wit: 14, intellect: 18 }
      }
    ]
  },
  {
    category: "The Test of Loyalty",
    question: "A close companion makes a serious mistake. What would you do?",
    description: "Loyalty can be expressed in more ways than simply agreeing.",
    quote: "True friendship is not measured by how often we agree.",
    options: [
      {
        house: "gryffindor",
        text: "Stand beside them and help them face the consequences.",
        description: "Courage means supporting someone even during difficult moments.",
        scores: { bravery: 12, courage: 16, honor: 16 }
      },
      {
        house: "slytherin",
        text: "Help them find a practical way to recover and move forward.",
        description: "A difficult setback should not become a permanent defeat.",
        scores: { ambition: 14, cunning: 16, strategy: 16 }
      },
      {
        house: "hufflepuff",
        text: "Listen patiently and offer support without abandoning them.",
        description: "Loyalty is demonstrated through consistent understanding.",
        scores: { loyalty: 20, patience: 18, fairness: 10 }
      },
      {
        house: "ravenclaw",
        text: "Help them understand what went wrong and how to improve.",
        description: "Learning from mistakes is more valuable than repeating them.",
        scores: { wisdom: 16, wit: 12, intellect: 18 }
      }
    ]
  },
  {
    category: "The Unsolved Mystery",
    question: "A strange phenomenon appears across the castle. What would you investigate first?",
    description: "Your preferred approach can reveal how you confront the unknown.",
    quote: "Mysteries rarely surrender their secrets to a single kind of mind.",
    options: [
      {
        house: "gryffindor",
        text: "The place where the phenomenon is most dangerous.",
        description: "Direct investigation requires courage and initiative.",
        scores: { bravery: 18, courage: 16, honor: 8 }
      },
      {
        house: "slytherin",
        text: "Who might benefit from the phenomenon and why.",
        description: "Understanding motives can reveal hidden patterns.",
        scores: { ambition: 14, cunning: 18, strategy: 14 }
      },
      {
        house: "hufflepuff",
        text: "Whether anyone has been affected and needs assistance.",
        description: "People should never become secondary to a mystery.",
        scores: { loyalty: 18, patience: 14, fairness: 14 }
      },
      {
        house: "ravenclaw",
        text: "The patterns, causes and magical principles behind it.",
        description: "A mystery becomes understandable through careful observation.",
        scores: { wisdom: 18, wit: 14, intellect: 18 }
      }
    ]
  },
  {
    category: "The Uncertain Future",
    question: "You are offered a completely unfamiliar opportunity. What guides your decision?",
    description: "New beginnings often require balancing uncertainty with conviction.",
    quote: "The future is unwritten, but your choices give it direction.",
    options: [
      {
        house: "gryffindor",
        text: "The chance to do something meaningful despite the risks.",
        description: "Growth often begins beyond the familiar.",
        scores: { bravery: 18, courage: 16, honor: 8 }
      },
      {
        house: "slytherin",
        text: "Its potential to bring you closer to your goals.",
        description: "Ambition gives direction to unfamiliar opportunities.",
        scores: { ambition: 20, cunning: 12, strategy: 14 }
      },
      {
        house: "hufflepuff",
        text: "The people involved and the commitments it creates.",
        description: "A worthwhile opportunity should respect relationships.",
        scores: { loyalty: 18, patience: 14, fairness: 14 }
      },
      {
        house: "ravenclaw",
        text: "The experience and knowledge you could gain.",
        description: "Every unfamiliar path can become an opportunity to learn.",
        scores: { wisdom: 16, wit: 14, intellect: 20 }
      }
    ]
  },
  {
    category: "The Hall of Recognition",
    question: "What kind of recognition would mean the most to you?",
    description: "Consider the quality you would most like others to remember.",
    quote: "A legacy is not always measured by the number of people who know your name.",
    options: [
      {
        house: "gryffindor",
        text: "Being remembered for standing firm when others needed you.",
        description: "A courageous act can inspire people long after the moment passes.",
        scores: { bravery: 18, courage: 16, honor: 12 }
      },
      {
        house: "slytherin",
        text: "Being remembered for accomplishing something exceptional.",
        description: "Achievement demonstrates the power of focused ambition.",
        scores: { ambition: 20, cunning: 12, strategy: 14 }
      },
      {
        house: "hufflepuff",
        text: "Being remembered as someone people could always rely on.",
        description: "Trust is built through patience, fairness and loyalty.",
        scores: { loyalty: 20, patience: 16, fairness: 12 }
      },
      {
        house: "ravenclaw",
        text: "Being remembered for ideas and discoveries that endured.",
        description: "Knowledge can leave a lasting mark on the world.",
        scores: { wisdom: 18, wit: 12, intellect: 20 }
      }
    ]
  },
  {
    category: "The Forgotten Promise",
    question: "You discover that keeping an old promise will require considerable effort. What matters most?",
    description: "Commitments can reveal the difference between intention and character.",
    quote: "A promise is easy to make. Its meaning is discovered through action.",
    options: [
      {
        house: "gryffindor",
        text: "Having the courage to fulfil it, regardless of difficulty.",
        description: "A commitment deserves action even when the path becomes difficult.",
        scores: { bravery: 16, courage: 18, honor: 14 }
      },
      {
        house: "slytherin",
        text: "Finding the most effective way to honour it.",
        description: "Determination and planning can overcome difficult obstacles.",
        scores: { ambition: 14, cunning: 14, strategy: 18 }
      },
      {
        house: "hufflepuff",
        text: "Remembering the trust someone placed in you.",
        description: "Keeping promises is an expression of lasting loyalty.",
        scores: { loyalty: 20, patience: 16, fairness: 12 }
      },
      {
        house: "ravenclaw",
        text: "Understanding the original purpose of the promise.",
        description: "Context helps determine the most thoughtful course of action.",
        scores: { wisdom: 18, wit: 12, intellect: 16 }
      }
    ]
  },
  {
    category: "The Council of Houses",
    question: "You must lead a group with four very different opinions. What is your approach?",
    description: "Leadership is often tested when agreement seems impossible.",
    quote: "A true leader understands that strength can take many forms.",
    options: [
      {
        house: "gryffindor",
        text: "Make a firm decision and take responsibility for it.",
        description: "Leadership sometimes requires decisive courage.",
        scores: { bravery: 16, courage: 18, honor: 12 }
      },
      {
        house: "slytherin",
        text: "Identify common interests and negotiate a workable outcome.",
        description: "Strategic thinking can turn disagreement into progress.",
        scores: { ambition: 16, cunning: 16, strategy: 18 }
      },
      {
        house: "hufflepuff",
        text: "Give everyone a fair opportunity to be heard.",
        description: "Lasting cooperation begins with patience and respect.",
        scores: { loyalty: 16, patience: 18, fairness: 18 }
      },
      {
        house: "ravenclaw",
        text: "Compare the arguments and find the most reasonable solution.",
        description: "Good decisions are strengthened by careful reasoning.",
        scores: { wisdom: 18, wit: 14, intellect: 18 }
      }
    ]
  },
  {
    category: "The Mirror of Reflection",
    question: "When reflecting on your greatest weakness, what would you most want to improve?",
    description: "Self-awareness begins with recognizing the qualities we wish to develop.",
    quote: "The most revealing discoveries sometimes begin within ourselves.",
    options: [
      {
        house: "gryffindor",
        text: "Learning to remain brave even when uncertainty grows.",
        description: "Courage can be developed through reflection and experience.",
        scores: { bravery: 18, courage: 18, honor: 8 }
      },
      {
        house: "slytherin",
        text: "Becoming more disciplined in pursuing long-term goals.",
        description: "Ambition becomes powerful when supported by consistency.",
        scores: { ambition: 18, cunning: 12, strategy: 16 }
      },
      {
        house: "hufflepuff",
        text: "Learning to balance helping others with personal boundaries.",
        description: "Kindness and loyalty also require self-understanding.",
        scores: { loyalty: 18, patience: 18, fairness: 12 }
      },
      {
        house: "ravenclaw",
        text: "Turning knowledge into action instead of endless analysis.",
        description: "Wisdom grows when understanding is applied thoughtfully.",
        scores: { wisdom: 18, wit: 12, intellect: 18 }
      }
    ]
  },
  {
    category: "The Final Enigma",
    question: "If you could master one quality above all others, which would you choose?",
    description: "There is no universal answer. Choose the quality that resonates most deeply.",
    quote: "The Hat has listened carefully. Now, what does your heart seek?",
    options: [
      {
        house: "gryffindor",
        text: "The courage to stand firm for what is right.",
        description: "Bravery gives conviction the strength to become action.",
        scores: { bravery: 20, courage: 18, honor: 12 }
      },
      {
        house: "slytherin",
        text: "The ambition to turn difficult dreams into reality.",
        description: "Determination and strategy give purpose to achievement.",
        scores: { ambition: 20, cunning: 14, strategy: 16 }
      },
      {
        house: "hufflepuff",
        text: "The loyalty to remain dependable through every season.",
        description: "Trust and patience form the foundation of lasting bonds.",
        scores: { loyalty: 20, patience: 18, fairness: 12 }
      },
      {
        house: "ravenclaw",
        text: "The wisdom to understand the world and question everything.",
        description: "Curiosity and intellect make every discovery meaningful.",
        scores: { wisdom: 20, wit: 14, intellect: 18 }
      }
    ]
  }
];

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

// ==========================================
// QUIZ STATE
// ==========================================

const quizState = {
  questions: [],
  currentIndex: 0,
  selectedOption: null,

  houseScores: {
    gryffindor: 0,
    slytherin: 0,
    hufflepuff: 0,
    ravenclaw: 0
  },

  traitScores: {
    bravery: 0,
    courage: 0,
    honor: 0,
    ambition: 0,
    cunning: 0,
    strategy: 0,
    loyalty: 0,
    patience: 0,
    fairness: 0,
    wisdom: 0,
    wit: 0,
    intellect: 0
  }
};

// ==========================================
// RANDOMIZATION — FISHER-YATES
// ==========================================

const shuffle = (items) => {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[randomIndex]] =
      [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
};

const createQuiz = () => {
  return shuffle(QUESTIONS)
    .slice(0, QUESTIONS_PER_ATTEMPT)
    .map(question => ({
      ...question,
      options: shuffle(question.options)
    }));
};

// ==========================================
// QUESTION RENDERING
// ==========================================

const setCategory = (category) => {
  if (!questionCategory) return;

  const textNode = [...questionCategory.childNodes]
    .find(node => node.nodeType === Node.TEXT_NODE);

  if (textNode) {
    textNode.textContent = ` ${category}`;
  }
};

const setNextButtonText = (text) => {
  if (!nextButton) return;

  const textNode = [...nextButton.childNodes]
    .find(node => node.nodeType === Node.TEXT_NODE);

  if (textNode) {
    textNode.textContent = ` ${text} `;
  }
};

const renderOptions = (options) => {
  optionCards.forEach((card, index) => {
    const option = options[index];

    const radio = card.querySelector('input[type="radio"]');
    const label = card.querySelector("label");

    const answerText = label?.querySelector(
      'span[role="heading"]'
    );

    const descriptionText = label?.querySelector(
      "span.description"
    );

    if (!option || !radio || !answerText || !descriptionText) {
      return;
    }

    // Preserve the existing article and its CSS-generated numbering.
    card.dataset.house = option.house;
    card.dataset.text = String.fromCharCode(65 + index);

    radio.value = option.house;
    radio.dataset.text = String.fromCharCode(65 + index);

    // The old inline handlers are replaced by delegated JS handling.
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
    questionNumber.textContent = ROMAN_NUMERALS[current];
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

const renderQuestion = () => {
  const question = quizState.questions[quizState.currentIndex];

  if (!question) return;

  quizState.selectedOption = null;

  setCategory(question.category);

  if (questionHeading) {
    questionHeading.textContent = question.question;
  }

  if (questionDescription) {
    questionDescription.textContent = question.description;
  }

  if (sortingQuote) {
    sortingQuote.textContent = question.quote;
  }

  renderOptions(question.options);
  updateProgress();

  if (nextButton) {
    nextButton.disabled = true;
  }

  setNextButtonText(
    quizState.currentIndex === QUESTIONS_PER_ATTEMPT - 1
      ? "Reveal Result"
      : "Next Question"
  );
};

// ==========================================
// ANSWER SELECTION
// ==========================================

const selectOption = (radio) => {
  const card = radio.closest(".option-card");

  if (!card) return;

  const question = quizState.questions[quizState.currentIndex];

  const selected = question.options.find(
    option => option.house === radio.value
  );

  if (!selected) return;

  quizState.selectedOption = selected;

  if (nextButton) {
    nextButton.disabled = false;
  }
};

// Event delegation works for all seven dynamically rendered questions.
optionsGroup?.addEventListener("change", (event) => {
  const radio = event.target.closest(
    'input[type="radio"][name="sorting-answer"]'
  );

  if (!radio || !optionsGroup.contains(radio)) return;

  selectOption(radio);
});

// ==========================================
// SCORING
// ==========================================

const recordAnswer = (option) => {
  const traitEntries = Object.entries(option.scores);

  for (const [trait, score] of traitEntries) {
    if (!(trait in quizState.traitScores)) continue;

    quizState.traitScores[trait] += score;
    quizState.houseScores[option.house] += score;
  }
};

const calculateResult = () => {
  const highestScore = Math.max(
    ...Object.values(quizState.houseScores)
  );

  const tiedHouses = Object.entries(quizState.houseScores)
    .filter(([, score]) => score === highestScore)
    .map(([house]) => house);

  // Resolve an exact tie using the highest accumulated trait score.
  if (tiedHouses.length === 1) {
    return tiedHouses[0];
  }

  const traitTotals = tiedHouses.map(house => ({
    house,
    score: HOUSE_TRAITS[house].reduce(
      (total, trait) => total + quizState.traitScores[trait],
      0
    )
  }));

  const highestTraitTotal = Math.max(
    ...traitTotals.map(item => item.score)
  );

  const finalCandidates = traitTotals
    .filter(item => item.score === highestTraitTotal)
    .map(item => item.house);

  // Only a complete tie remains random.
  return shuffle(finalCandidates)[0];
};

// ==========================================
// RESULT
// ==========================================

const revealResult = () => {
  const house = calculateResult();

  const result = {
    house,
    houseScores: quizState.houseScores,
    traitScores: quizState.traitScores,
    allocatedAt: new Date().toISOString()
  };

  sessionStorage.setItem(
    "sorticus.result",
    JSON.stringify(result)
  );

  window.location.assign("profile.html");
};

// ==========================================
// QUIZ PROGRESSION
// ==========================================

const nextQuestion = () => {
  if (!quizState.selectedOption) return;

  recordAnswer(quizState.selectedOption);

  const isLastQuestion =
    quizState.currentIndex === QUESTIONS_PER_ATTEMPT - 1;

  if (isLastQuestion) {
    revealResult();
    return;
  }

  quizState.currentIndex++;
  renderQuestion();
};

nextButton?.addEventListener("click", nextQuestion);

// ==========================================
// INITIALIZATION
// ==========================================

const initializeQuiz = () => {
  if (
    !optionsGroup ||
    optionCards.length !== 4 ||
    !questionHeading ||
    !nextButton
  ) {
    console.error("Sorticus Quiz: Required quiz elements were not found.");
    return;
  }

  quizState.questions = createQuiz();

  renderQuestion();
};

initializeQuiz();
