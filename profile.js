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
  // Parchment export — download or share the certificate as an image.
  // All wording is read from the certificate on the page, so editing the
  // text in profile.html changes the image too.
  // ------------------------------------------------------

  // <parchment-drawing>
  const PARCHMENT = {
    width: 1000, // drawing units; the PNG is width × scale pixels wide
    minHeight: 1250,
    scale: 1.6, // 1000 × 1.6 = 1600 px wide
    // Colours match the design tokens in Base-style.css.
    color: {
      card: "hsl(248, 7%, 17%)",
      cardEdge: "hsl(240, 9%, 10%)",
      gold: "hsl(39, 72%, 69%)",
      goldGlow: "hsla(39, 72%, 69%, 0.55)",
      goldFade: "hsla(39, 72%, 69%, 0)",
      goldDeep: "hsl(39, 72%, 50%)",
      goldMuted: "hsl(39, 39%, 57%)",
      text: "hsl(35, 24%, 76%)",
      line: "hsl(39, 15%, 27%)",
      quoteTop: "hsl(240, 9%, 15%)",
      quoteBottom: "hsl(240, 18%, 8%)"
    },
    font: {
      garamond: '"EB Garamond", Georgia, serif',
      playfair: '"Playfair Display", Georgia, serif',
      astloch: '"Astloch", "Segoe Print", "Bradley Hand", cursive'
    }
  };

  const setSpacing = (ctx, px) => {
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
  };

  const setGlow = (ctx, on) => {
    ctx.shadowColor = on ? PARCHMENT.color.goldGlow : "transparent";
    ctx.shadowBlur = on ? 24 * PARCHMENT.scale : 0; // shadows ignore ctx.scale
  };

  const wrapLines = (ctx, text, maxWidth) => {
    const lines = [];
    let line = "";

    text.split(" ").forEach((word) => {
      const attempt = line ? `${line} ${word}` : word;

      if (line && ctx.measureText(attempt).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = attempt;
      }
    });

    if (line) lines.push(line);

    return lines;
  };

  // Like CSS text-wrap: balance — same number of lines, but evened out.
  const balancedLines = (ctx, text, maxWidth) => {
    const count = wrapLines(ctx, text, maxWidth).length;

    if (count < 2) return wrapLines(ctx, text, maxWidth);

    let low = maxWidth / 2;
    let high = maxWidth;

    for (let i = 0; i < 12; i++) {
      const middle = (low + high) / 2;

      if (wrapLines(ctx, text, middle).length <= count) high = middle;
      else low = middle;
    }

    return wrapLines(ctx, text, high);
  };

  // Largest font size that keeps the text on a single line.
  const fitSize = (ctx, fontFor, text, maxWidth, start, min) => {
    let size = start;

    ctx.font = fontFor(size);

    while (size > min && ctx.measureText(text).width > maxWidth) {
      size -= 2;
      ctx.font = fontFor(size);
    }

    return size;
  };

  const roundedRectPath = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const fadeRule = (ctx, fromX, toX, y) => {
    const gradient = ctx.createLinearGradient(fromX, 0, toX, 0);

    gradient.addColorStop(0, PARCHMENT.color.goldFade);
    gradient.addColorStop(1, PARCHMENT.color.gold);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fromX, y);
    ctx.lineTo(toX, y);
    ctx.stroke();
  };

  // Draws the whole parchment and returns the height it needs.
  // Pass height 0 to only measure (nothing visible is drawn).
  const drawParchment = (ctx, content, crest, dateText, height) => {
    const { width: W, scale: S, color: C, font: F } = PARCHMENT;
    const cx = W / 2;

    ctx.save();
    ctx.scale(S, S);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    if (height > 0) {
      // Card with a soft vignette
      const card = ctx.createRadialGradient(cx, height * 0.4, 60, cx, height * 0.4, height * 0.85);
      card.addColorStop(0, C.card);
      card.addColorStop(1, C.cardEdge);
      ctx.fillStyle = card;
      ctx.fillRect(0, 0, W, height);

      // Double frame with corner diamonds
      roundedRectPath(ctx, 28, 28, W - 56, height - 56, 26);
      ctx.lineWidth = 3;
      ctx.strokeStyle = C.goldMuted;
      ctx.stroke();

      roundedRectPath(ctx, 46, 46, W - 92, height - 92, 16);
      ctx.lineWidth = 1;
      ctx.strokeStyle = C.line;
      ctx.stroke();

      [[46, 46], [W - 46, 46], [46, height - 46], [W - 46, height - 46]].forEach(([x, y]) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = C.goldMuted;
        ctx.fillRect(-6, -6, 12, 12);
        ctx.restore();
      });
    }

    let y = 130;

    // ---- Kicker, flanked by fading rules ----
    const kicker = content.kicker.toUpperCase();

    ctx.font = `500 21px ${F.garamond}`;
    setSpacing(ctx, 4);

    const kickerWidth = ctx.measureText(kicker).width;

    ctx.fillStyle = C.gold;
    setGlow(ctx, true);
    ctx.fillText(kicker, cx + 2, y);
    setGlow(ctx, false);
    setSpacing(ctx, 0);

    const ruleLength = Math.min(110, (W - 160 - kickerWidth) / 2 - 22);

    if (ruleLength > 24) {
      const edge = kickerWidth / 2 + 22;

      fadeRule(ctx, cx - edge - ruleLength, cx - edge, y - 7);
      fadeRule(ctx, cx + edge + ruleLength, cx + edge, y - 7);
    }

    // ---- Title ----
    y += 92;
    ctx.fillStyle = C.goldDeep;
    ctx.font = `700 56px ${F.garamond}`;
    setSpacing(ctx, 3);

    balancedLines(ctx, content.title.toUpperCase(), 780).forEach((line) => {
      ctx.fillText(line, cx + 1.5, y);
      y += 66;
    });

    setSpacing(ctx, 0);

    // ---- Introduction ----
    y += 2;
    ctx.fillStyle = C.text;
    ctx.font = `italic 32px ${F.playfair}`;

    balancedLines(ctx, content.intro, 780).forEach((line) => {
      ctx.fillText(line, cx, y);
      y += 44;
    });

    // ---- Student name (shrinks, then wraps, if it is very long) ----
    y += 62;

    const nameFont = (size) => `700 ${size}px ${F.garamond}`;
    let nameSize = fitSize(ctx, nameFont, content.name, 820, 124, 72);
    let nameLines = [content.name];

    if (ctx.measureText(content.name).width > 820) {
      nameSize = 64;
      ctx.font = nameFont(nameSize);
      nameLines = balancedLines(ctx, content.name, 820);
    }

    ctx.fillStyle = C.gold;
    setGlow(ctx, true);

    nameLines.forEach((line, index) => {
      ctx.fillText(line, cx, y + index * nameSize * 1.1);
    });

    setGlow(ctx, false);
    y += (nameLines.length - 1) * nameSize * 1.1;

    const nameWidth = Math.max(...nameLines.map((line) => ctx.measureText(line).width));

    // Sits below the descenders (the "g" in a name like "Lovegood").
    const underlineY = y + Math.round(nameSize * 0.3);

    ctx.strokeStyle = C.goldDeep;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - nameWidth / 2 - 18, underlineY);
    ctx.lineTo(cx + nameWidth / 2 + 18, underlineY);
    ctx.stroke();

    // ---- Crest ----
    y = underlineY + 34;

    if (crest) {
      const size = 230;
      const x = cx - size / 2;

      ctx.save();
      roundedRectPath(ctx, x, y, size, size, 30);
      ctx.clip();
      ctx.drawImage(crest, x, y, size, size);
      ctx.restore();

      roundedRectPath(ctx, x, y, size, size, 30);
      ctx.lineWidth = 3;
      ctx.strokeStyle = C.goldMuted;
      ctx.stroke();

      y += size;
    }

    // ---- Motto ----
    y += 60;
    ctx.fillStyle = C.goldDeep;
    ctx.font = `700 40px ${F.garamond}`;

    balancedLines(ctx, content.motto, 780).forEach((line) => {
      ctx.fillText(line, cx, y);
      y += 48;
    });

    // ---- "Ascended into" + house ----
    y += 22;
    ctx.fillStyle = C.text;
    ctx.font = `400 28px ${F.garamond}`;
    setSpacing(ctx, 6);
    ctx.fillText(content.ascended.toUpperCase(), cx + 3, y);

    y += 74;

    const houseText = content.house.toUpperCase();
    const houseSize = fitSize(ctx, (size) => `700 ${size}px ${F.garamond}`, houseText, 800, 74, 40);

    ctx.font = `700 ${houseSize}px ${F.garamond}`;
    setSpacing(ctx, 4);
    ctx.fillStyle = C.gold;
    setGlow(ctx, true);
    ctx.fillText(houseText, cx + 2, y);
    setGlow(ctx, false);
    setSpacing(ctx, 0);

    // ---- Quote ----
    if (content.quote) {
      y += 50;
      ctx.font = `italic 30px ${F.astloch}`;

      const quoteLines = balancedLines(ctx, `\u201C\u00A0${content.quote}\u00A0\u201D`, 700);
      const lineHeight = 42;
      const boxWidth = 800;
      const boxHeight = quoteLines.length * lineHeight + 44;
      const boxX = cx - boxWidth / 2;

      const fill = ctx.createLinearGradient(boxX, y, boxX + boxWidth, y + boxHeight);
      fill.addColorStop(0, C.quoteTop);
      fill.addColorStop(1, C.quoteBottom);

      roundedRectPath(ctx, boxX, y, boxWidth, boxHeight, 24);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = C.line;
      ctx.stroke();

      ctx.fillStyle = C.text;
      ctx.font = `italic 30px ${F.astloch}`;

      quoteLines.forEach((line, index) => {
        ctx.fillText(line, cx, y + 50 + index * lineHeight);
      });

      y += boxHeight;
    }

    // ---- Signatures ----
    const signatures = content.signatures.slice(0, 2);

    if (signatures.length) {
      y += 74;

      const columns = signatures.length === 1 ? [cx] : [cx - 235, cx + 235];

      signatures.forEach((signature, index) => {
        const x = columns[index];

        ctx.strokeStyle = C.line;
        ctx.lineWidth = 1.5;
        ctx.lineCap = "butt";
        ctx.beginPath();
        ctx.moveTo(x - 160, y);
        ctx.lineTo(x + 160, y);
        ctx.stroke();

        const nameFontSize = fitSize(ctx, (size) => `italic ${size}px ${F.playfair}`, signature.name, 320, 34, 20);

        ctx.font = `italic ${nameFontSize}px ${F.playfair}`;
        ctx.fillStyle = C.gold;
        setGlow(ctx, true);
        ctx.fillText(signature.name, x, y + 46);
        setGlow(ctx, false);

        const role = signature.role.toUpperCase();

        setSpacing(ctx, 2);

        const roleSize = fitSize(ctx, (size) => `italic 400 ${size}px ${F.garamond}`, role, 320, 16, 11);

        ctx.font = `italic 400 ${roleSize}px ${F.garamond}`;
        ctx.fillStyle = C.text;
        ctx.fillText(role, x + 1, y + 74);
        setSpacing(ctx, 0);
      });

      y += 74;
    }

    // ---- Date, pinned to the bottom of the card ----
    let bottom = y + 70;

    if (dateText) {
      const dateY = Math.max(y + 60, height - 84);

      ctx.font = `italic 400 22px ${F.garamond}`;
      ctx.fillStyle = C.goldMuted;
      ctx.fillText(dateText, cx, dateY);
      bottom = dateY + 80;
    }

    ctx.restore();

    return bottom;
  };
  // </parchment-drawing>

  // ---- Reading the certificate on the page ----
  const cleanText = (node) => (node?.textContent ?? "").replace(/\s+/g, " ").trim();

  const readParchmentContent = () => {
    const nameElement = document.querySelector("#student-name");
    const article = nameElement?.closest("article");

    if (!article) return null;

    const houseElement = document.querySelector("#house-name");
    const ascended = [...(houseElement?.closest("p")?.childNodes ?? [])]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    const signatures = [...article.querySelectorAll(":scope > div:last-of-type p")]
      .map((paragraph) => {
        const spans = paragraph.querySelectorAll("span");

        return {
          name: cleanText(spans[0]),
          role: spans.length > 1 ? cleanText(spans[spans.length - 1]) : ""
        };
      })
      .filter((signature) => signature.name);

    return {
      kicker: cleanText(article.parentElement?.querySelector("h2")),
      title: cleanText(article.querySelector("h3")),
      intro: cleanText(article.querySelector("h3 + p")),
      name: cleanText(nameElement),
      crestSrc: document.querySelector("#house-crest")?.getAttribute("src") ?? "",
      motto: cleanText(document.querySelector("#house-motto")),
      ascended: ascended || "Ascended into",
      house: cleanText(houseElement),
      quote: cleanText(article.querySelector("blockquote p")),
      signatures
    };
  };

  const formatLongDate = (iso) => {
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  };

  // ---- Making the image ----
  const makeCanvas = (width, height) => {
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    return canvas;
  };

  // Resolves to null (not an error) when the crest can't be loaded, so the
  // parchment is still produced without it.
  const loadImage = (src) =>
    new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }

      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.crossOrigin = "anonymous";
      image.src = src;
    });

  const loadParchmentFonts = async () => {
    if (!document.fonts?.load) return;

    const { font: F } = PARCHMENT;

    try {
      await Promise.all([
        document.fonts.load(`700 40px ${F.garamond}`),
        document.fonts.load(`500 21px ${F.garamond}`),
        document.fonts.load(`italic 400 20px ${F.garamond}`),
        document.fonts.load(`italic 32px ${F.playfair}`),
        document.fonts.load(`italic 30px ${F.astloch}`)
      ]);
    } catch {
      // The fallback fonts in each stack are used instead.
    }
  };

  const renderParchmentBlob = async (info) => {
    const content = readParchmentContent();

    if (!content) throw new Error("The certificate was not found on this page.");

    await loadParchmentFonts();

    const crest = await loadImage(content.crestSrc);
    const date = formatLongDate(info.result.allocatedAt);
    const dateText = date ? `Inscribed on ${date}` : "";

    // Measure first, so unusually long text can't run off the card.
    const needed = drawParchment(makeCanvas(4, 4).getContext("2d"), content, crest, dateText, 0);
    const height = Math.max(PARCHMENT.minHeight, Math.ceil(needed));

    const canvas = makeCanvas(
      Math.round(PARCHMENT.width * PARCHMENT.scale),
      Math.round(height * PARCHMENT.scale)
    );

    drawParchment(canvas.getContext("2d"), content, crest, dateText, height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("The image could not be created."))),
        "image/png"
      );
    });
  };

  // ---- Saving and sharing ----
  const fileSlug = (text) =>
    text
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "student";

  const parchmentFileName = (info) =>
    `Sorticus-Parchment-${fileSlug(info.name)}-${fileSlug(HOUSES[info.result.house].name)}.png`;

  const downloadBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 15000);
  };

  // Returns false when this browser can't share files (the caller then saves
  // the image instead). Closing the share sheet is not an error.
  const shareBlob = async (blob, fileName, info) => {
    const file = new File([blob], fileName, { type: "image/png" });

    if (!navigator.canShare || !navigator.canShare({ files: [file] })) return false;

    try {
      await navigator.share({
        files: [file],
        title: "My Hogwarts parchment",
        text: `I was sorted into ${HOUSES[info.result.house].name}! Find your house on Sorticus: ${new URL(PAGES.HOME, window.location.href).href}`
      });
    } catch (error) {
      if (error?.name !== "AbortError") throw error;
    }

    return true;
  };

  const initParchmentActions = (info) => {
    const actions = document.querySelector("#parchment-actions");
    const downloadButton = document.querySelector("#download-parchment");
    const shareButton = document.querySelector("#share-parchment");
    const note = document.querySelector("#parchment-note");
    const buttons = [downloadButton, shareButton].filter(Boolean);

    // The buttons are optional: without them in profile.html, nothing happens.
    if (!buttons.length) return;

    const say = (message, type = "info") => {
      if (note) {
        note.textContent = message;
        note.dataset.type = type;
      } else if (message) {
        showStatus(message, { type });
      }
    };

    // Made once, ahead of time, so sharing starts instantly on tap — phones
    // only allow sharing right after a tap.
    let blobPromise = null;

    const getBlob = () => {
      blobPromise ??= renderParchmentBlob(info).catch((error) => {
        blobPromise = null;
        throw error;
      });

      return blobPromise;
    };

    const run = async (button, action) => {
      buttons.forEach((item) => {
        item.disabled = true;
      });
      button.setAttribute("aria-busy", "true");
      say("");

      try {
        await action();
      } catch (error) {
        console.error("Sorticus parchment:", error);

        if (error?.name === "NotAllowedError") {
          say("Your browser needs a fresh tap to share. Tap the button once more.");
        } else {
          say("Sorry, the parchment couldn't be created. Please try again.", "error");
        }
      } finally {
        buttons.forEach((item) => {
          item.disabled = false;
        });
        button.removeAttribute("aria-busy");
      }
    };

    downloadButton?.addEventListener("click", () =>
      run(downloadButton, async () => {
        downloadBlob(await getBlob(), parchmentFileName(info));
        say("Your parchment has been saved to your device.");
      })
    );

    shareButton?.addEventListener("click", () =>
      run(shareButton, async () => {
        const blob = await getBlob();
        const fileName = parchmentFileName(info);

        if (!(await shareBlob(blob, fileName, info))) {
          downloadBlob(blob, fileName);
          say("Sharing isn't available in this browser, so the parchment was saved instead. Attach it to your message.");
        }
      })
    );

    // Hidden in the HTML until there is a certificate to export.
    actions?.removeAttribute("hidden");
    buttons.forEach((item) => item.removeAttribute("hidden"));

    getBlob().catch(() => {}); // prepare it in the background
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
    initParchmentActions({ name, result });

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
