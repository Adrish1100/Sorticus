
"use strict";

// ==========================================
// SORTICUS — DATABASE & PROFILE MANAGEMENT
// ==========================================

const SUPABASE_URL = "https://kckdvicooamgggqhdwdt.supabase.co";
const SUPABASE_KEY = "sb_publishable_SPE-xfi9fH8zjC63OK5J4Q_ZgPFiND9";

const STORAGE = {
  displayName: "sorticus.displayName",
  result: "sorticus.result"
};

const HOUSES = {
  gryffindor: {
    name: "Gryffindor",
    crest: "Gryffindor-house-logo.jpg",
    motto: "Bravery, courage & determination"
  },
  slytherin: {
    name: "Slytherin",
    crest: "Slytherin-house-logo.jpg",
    motto: "Ambition, cunning & resourcefulness"
  },
  hufflepuff: {
    name: "Hufflepuff",
    crest: "Hufflepuff-house-logo.jpg",
    motto: "Patience, loyalty & fairness"
  },
  ravenclaw: {
    name: "Ravenclaw",
    crest: "Ravenclaw-house-logo.jpg",
    motto: "Wit, learning & wisdom"
  }
};

// ==========================================
// SUPABASE INITIALIZATION
// ==========================================

const initializeSupabase = async () => {
  if (
    SUPABASE_URL.startsWith("YOUR_") ||
    SUPABASE_KEY.startsWith("YOUR_")
  ) {
    throw new Error("Add your Supabase URL and publishable key.");
  }

  const { createClient } = await import(
    "https://esm.sh/@supabase/supabase-js@2"
  );

  return createClient(SUPABASE_URL, SUPABASE_KEY);
};

// ==========================================
// AUTHENTICATION
// ==========================================

const getAuthenticatedUser = async (supabase) => {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  if (sessionData.session?.user) {
    return sessionData.session.user;
  }

  const { data, error } =
    await supabase.auth.signInAnonymously();

  if (error) throw error;

  return data.user;
};

// ==========================================
// PROFILE MANAGEMENT
// ==========================================

const saveProfile = async (supabase, user, displayName) => {
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: displayName
    })
    .eq("user_id", user.id);

  if (error) throw error;
};

// ==========================================
// RESULT MANAGEMENT
// ==========================================

const getSavedResult = async (supabase, user) => {
  const { data, error } = await supabase
    .from("sorting_results")
    .select("house, trait_scores, allocated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return data;
};

const saveResult = async (supabase, user, result) => {
  const { error } = await supabase
    .from("sorting_results")
    .insert({
      user_id: user.id,
      house: result.house,
      trait_scores: result.traitScores,
      allocated_at: result.allocatedAt
    });

  if (error) throw error;

  return getSavedResult(supabase, user);
};

// ==========================================
// CERTIFICATE RENDERING
// ==========================================

const renderCertificate = (displayName, result) => {
  const house = HOUSES[result.house];

  if (!house) {
    throw new Error("Invalid house received.");
  }

  const studentName = document.querySelector("#student-name");
  const houseName = document.querySelector("#house-name");
  const houseCrest = document.querySelector("#house-crest");
  const houseMotto = document.querySelector("#house-motto");

  if (studentName) {
    studentName.textContent = displayName;
  }

  if (houseName) {
    houseName.textContent = `House ${house.name}`;
  }

  if (houseCrest) {
    houseCrest.src = house.crest;
    houseCrest.alt = `${house.name} Heraldic Crest`;
  }

  if (houseMotto) {
    houseMotto.textContent = house.motto;
  }
};

// ==========================================
// REGISTRY MANAGEMENT
// ==========================================

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
};

const createRegistryCard = (student) => {
  const house = HOUSES[student.house];

  if (!house) return null;

  const article = document.createElement("article");

  const dateParagraph = document.createElement("p");
  dateParagraph.append("allocation date: ");

  const time = document.createElement("time");
  time.className = "alloc-time";
  time.dateTime = student.allocated_on;
  time.textContent = formatDate(student.allocated_on);

  dateParagraph.append(time);

  const name = document.createElement("h3");
  name.className = "stud-name";
  name.textContent = student.display_name;

  const houseParagraph = document.createElement("p");
  houseParagraph.append("Ascended into ");

  const houseLabel = document.createElement("strong");
  houseLabel.className = "gold";
  houseLabel.textContent = house.name;

  houseParagraph.append(houseLabel);

  const crest = document.createElement("img");
  crest.src = house.crest;
  crest.alt = `${house.name} Heraldic Crest`;

  article.append(
    dateParagraph,
    name,
    houseParagraph,
    crest
  );

  return article;
};

const renderRegistry = async (supabase) => {
  const registrySection = [...document.querySelectorAll("main > section")]
    .find(section =>
      section.querySelector("h2")?.textContent.trim() ===
      "Peer Allocation Registry"
    );

  const registryContainer =
    registrySection?.querySelector(":scope > div");

  if (!registryContainer) return;

  const { data, error } = await supabase
    .from("public_registry")
    .select("display_name, house, allocated_on")
    .order("allocated_on", { ascending: false })
    .limit(100);

  if (error) throw error;

  const cards = data
    .map(createRegistryCard)
    .filter(Boolean);

  registryContainer.replaceChildren(...cards);
};

// ==========================================
// APPLICATION INITIALIZATION
// ==========================================

const initializeManage = async () => {
  if (
    window.location.pathname.split("/").pop().toLowerCase() !==
    "profile.html"
  ) {
    return;
  }

  try {
    const displayName =
      sessionStorage.getItem(STORAGE.displayName);

    const rawResult =
      sessionStorage.getItem(STORAGE.result);

    if (!displayName || !rawResult) {
      throw new Error("Profile or sorting result is missing.");
    }

    const result = JSON.parse(rawResult);

    if (!HOUSES[result.house]) {
      throw new Error("The sorting result contains an invalid house.");
    }

    const supabase = await initializeSupabase();

    const user = await getAuthenticatedUser(supabase);

    await saveProfile(supabase, user, displayName);

    // Preserve the first allocation if the student already has one.
    let savedResult = await getSavedResult(supabase, user);

    if (!savedResult) {
      try {
        savedResult = await saveResult(supabase, user, result);
      } catch (error) {
        // Another request may have inserted the result first.
        savedResult = await getSavedResult(supabase, user);

        if (!savedResult) throw error;
      }
    }

    renderCertificate(displayName, savedResult);

    await renderRegistry(supabase);

  } catch (error) {
    console.error("Sorticus Manage:", error);

    alert(
      "We couldn't load your sorting records. Please try again."
    );
  }
};

initializeManage();
