/* ==========================================================
   SORTICUS — profile.js  (profile.html only)

   Needs main.js loaded BEFORE it:
       <script src="main.js" defer></script>
       <script src="profile.js" defer></script>
   ========================================================== */
(function () {
  "use strict";

  const core = window.Sorticus;

  if (!core) {
    console.error("Sorticus profile: load main.js before profile.js.");
    return;
  }

  if (core.PAGE !== "profile") return;

  const { HOUSES, PAGES, STORAGE, isProfileComplete, localStore, readSortedResult } = core;

  // ------------------------------------------------------
  // Status messages (shown at the top of <main>)
  // Style these in your CSS: .status-messages, .status-message[data-type]
  // ------------------------------------------------------
  const getStatusHost = () => {
    const main = document.querySelector("main");

    if (!main) return null;

    let host = main.querySelector(":scope > .status-messages");

    if (!host) {
      host = document.createElement("div");
      host.className = "status-messages";
      main.prepend(host);
    }

    return host;
  };

  const showStatus = (message, { type = "info", href, linkText } = {}) => {
    const host = getStatusHost();

    if (!host) return;

    const paragraph = document.createElement("p");
    paragraph.className = "status-message";
    paragraph.dataset.type = type;
    paragraph.setAttribute("role", type === "error" ? "alert" : "status");
    paragraph.append(message);

    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = linkText;
      paragraph.append(" ", link);
    }

    host.append(paragraph);
  };

  // ------------------------------------------------------
  // Certificate
  // ------------------------------------------------------
  const renderCertificate = (displayName, result) => {
    const house = HOUSES[result.house];

    if (!house) throw new Error("Invalid house in sorting result.");

    const studentName = document.querySelector("#student-name");
    const houseName = document.querySelector("#house-name");
    const houseCrest = document.querySelector("#house-crest");
    const houseMotto = document.querySelector("#house-motto");

    if (studentName) studentName.textContent = displayName;
    if (houseName) houseName.textContent = `House ${house.name}`;
    if (houseMotto) houseMotto.textContent = house.motto;

    if (houseCrest) {
      houseCrest.src = house.crest;
      houseCrest.alt = `${house.name} Heraldic Crest`;
    }
  };

  // ------------------------------------------------------
  // Peer Allocation Registry
  // The famous students are written directly in profile.html.
  // This file only adds the visitor's own card.
  // ------------------------------------------------------
  const formatRegistryDate = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(`${value.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  };

  // The visitor's own date in YYYY-MM-DD, in their local time zone.
  const toLocalDate = (iso) => {
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  // Prefers <div id="registry-list">. Falls back to the element after the
  // "Peer Allocation Registry" heading so the current HTML keeps working.
  const findRegistryContainer = () => {
    const byId = document.querySelector("#registry-list");

    if (byId) return byId;

    const heading = [...document.querySelectorAll("main h2")].find(
      (h2) => h2.textContent.trim() === "Peer Allocation Registry"
    );

    return heading?.nextElementSibling ?? null;
  };

  // The visitor's card is a copy of the first card already in the HTML, so its
  // markup and styling always match and no card HTML lives in this file.
  // data-you="true" lets you style it.
  const addOwnCard = (container, student) => {
    const house = HOUSES[student.house];
    const model = container.querySelector(":scope > article");

    if (!house || !model) {
      console.warn("Sorticus: no registry card found to copy for your own card.");
      return;
    }

    const card = model.cloneNode(true);
    const name = card.querySelector(".stud-name");
    const time = card.querySelector("time");
    const houseLabel = card.querySelector("strong");
    const crest = card.querySelector("img");

    if (name) name.textContent = student.name; // textContent: a typed name can't inject HTML

    if (time) {
      time.setAttribute("datetime", student.date);
      time.textContent = formatRegistryDate(student.date);
    }

    if (houseLabel) houseLabel.textContent = house.name;

    if (crest) {
      crest.src = house.crest;
      crest.alt = `${house.name} Heraldic Crest`;
    }

    card.dataset.you = "true";
    container.prepend(card);
  };

  // ------------------------------------------------------
  // Start
  // ------------------------------------------------------
  const initializeProfilePage = () => {
    const result = readSortedResult();
    const name = localStore.get(STORAGE.displayName)?.trim() || null;

    if (!result) {
      showStatus("No sorting result was found.", {
        href: isProfileComplete() ? PAGES.QUIZ : PAGES.HOME,
        linkText: isProfileComplete()
          ? "Begin the sorting ceremony"
          : "Set up your profile first"
      });
      return;
    }

    if (!name) {
      showStatus("Your profile is missing a name.", {
        href: PAGES.HOME,
        linkText: "Set up your profile"
      });
      return;
    }

    renderCertificate(name, result);

    const container = findRegistryContainer();

    if (container) {
      addOwnCard(container, {
        name,
        house: result.house,
        date: toLocalDate(result.allocatedAt)
      });
    }
  };

  try {
    initializeProfilePage();
  } catch (error) {
    console.error("Sorticus profile page:", error);
    showStatus("Something went wrong loading your certificate. Please try again.", {
      type: "error"
    });
  }
})();
