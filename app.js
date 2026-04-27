const state = {
  recipes: [],
  lastPayload: null,
};

const els = {
  form: document.querySelector("#recipeForm"),
  ingredients: document.querySelector("#ingredients"),
  diet: document.querySelector("#diet"),
  time: document.querySelector("#time"),
  difficulty: document.querySelector("#difficulty"),
  servings: document.querySelector("#servings"),
  notes: document.querySelector("#notes"),
  endpoint: document.querySelector("#endpoint"),
  model: document.querySelector("#model"),
  useProxy: document.querySelector("#useProxy"),
  proxyStatus: document.querySelector("#proxyStatus"),
  recipes: document.querySelector("#recipes"),
  loading: document.querySelector("#loading"),
  empty: document.querySelector("#emptyState"),
  copyButton: document.querySelector("#copyButton"),
  clearButton: document.querySelector("#clearButton"),
  demoButton: document.querySelector("#demoButton"),
  themeButton: document.querySelector("#themeButton"),
};

const defaults = {
  endpoint: "/api/recipes",
  model: "chatgpt-5.5",
};

function init() {
  els.endpoint.value = localStorage.getItem("recipejoy.endpoint") || defaults.endpoint;
  els.model.value = localStorage.getItem("recipejoy.model") || defaults.model;
  els.useProxy.checked = localStorage.getItem("recipejoy.useProxy") !== "false";
  document.body.classList.toggle("dark", localStorage.getItem("recipejoy.theme") === "dark");
  updateStatus();
  bindEvents();
}

function bindEvents() {
  els.form.addEventListener("submit", handleSubmit);
  els.endpoint.addEventListener("input", () => {
    localStorage.setItem("recipejoy.endpoint", els.endpoint.value.trim());
    updateStatus();
  });
  els.model.addEventListener("input", () => localStorage.setItem("recipejoy.model", els.model.value.trim()));
  els.useProxy.addEventListener("change", () => {
    localStorage.setItem("recipejoy.useProxy", String(els.useProxy.checked));
    updateStatus();
  });
  els.clearButton.addEventListener("click", () => {
    els.form.reset();
    els.endpoint.value = localStorage.getItem("recipejoy.endpoint") || defaults.endpoint;
    els.model.value = localStorage.getItem("recipejoy.model") || defaults.model;
    els.useProxy.checked = localStorage.getItem("recipejoy.useProxy") === "true";
    state.recipes = [];
    state.lastPayload = null;
    renderRecipes();
    updateStatus();
  });
  els.demoButton.addEventListener("click", () => {
    els.ingredients.value = "salmon, avocado, lime, quinoa, cucumber, yogurt";
    els.diet.value = "High protein";
    els.time.value = "30 minutes";
    els.difficulty.value = "Easy";
    els.servings.value = "2";
    els.notes.value = "fresh, bright, minimal cleanup";
    document.querySelector("#generator").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  els.copyButton.addEventListener("click", copyLastPayload);
  els.themeButton.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("recipejoy.theme", document.body.classList.contains("dark") ? "dark" : "light");
  });
  document.querySelectorAll(".quick-add button").forEach((button) => {
    button.addEventListener("click", () => addIngredient(button.textContent.trim()));
  });
}

function updateStatus(kind) {
  els.proxyStatus.className = "status";
  if (kind === "ok") {
    els.proxyStatus.classList.add("ok");
    els.proxyStatus.textContent = "proxy ok";
    return;
  }
  if (kind === "error") {
    els.proxyStatus.classList.add("error");
    els.proxyStatus.textContent = "fallback";
    return;
  }
  els.proxyStatus.textContent = els.useProxy.checked ? "proxy on" : "local fallback";
}

function addIngredient(value) {
  const current = parseIngredients(els.ingredients.value);
  if (!current.some((item) => item.toLowerCase() === value.toLowerCase())) {
    current.push(value);
  }
  els.ingredients.value = current.join(", ");
}

async function handleSubmit(event) {
  event.preventDefault();
  const payload = buildPayload();

  if (!payload.ingredients.length) {
    els.ingredients.focus();
    return;
  }

  setLoading(true);
  try {
    const response = els.useProxy.checked
      ? await requestFromProxy(payload)
      : createLocalResponse(payload);

    state.lastPayload = normalizeResponse(response, payload);
    state.recipes = state.lastPayload.recipes;
    updateStatus(els.useProxy.checked ? "ok" : undefined);
  } catch (error) {
    console.warn("Proxy generation failed, using local fallback.", error);
    state.lastPayload = createLocalResponse(payload);
    state.recipes = state.lastPayload.recipes;
    updateStatus("error");
  } finally {
    setLoading(false);
    renderRecipes();
    document.querySelector("#results").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function buildPayload() {
  return {
    schemaVersion: "recipejoy.mobile.v1",
    model: els.model.value.trim() || defaults.model,
    ingredients: parseIngredients(els.ingredients.value),
    filters: {
      diet: els.diet.value,
      time: els.time.value,
      difficulty: els.difficulty.value,
      servings: Number(els.servings.value || 2),
    },
    notes: els.notes.value.trim(),
    responseFormat: {
      type: "json",
      schema: "recipejoy.mobile.v1",
    },
  };
}

function parseIngredients(value) {
  return value
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function requestFromProxy(payload) {
  const endpoint = els.endpoint.value.trim() || defaults.endpoint;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Proxy returned ${response.status}`);
  }

  return response.json();
}

function normalizeResponse(response, request) {
  const recipes = Array.isArray(response) ? response : response.recipes;
  if (!Array.isArray(recipes)) {
    throw new Error("Proxy response must be an array or { recipes: [] }");
  }

  return {
    schemaVersion: response.schemaVersion || "recipejoy.mobile.v1",
    generatedAt: response.generatedAt || new Date().toISOString(),
    source: response.source || "proxy",
    request,
    recipes: recipes.map((recipe, index) => normalizeRecipe(recipe, request, index)),
  };
}

function normalizeRecipe(recipe, request, index) {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : request.ingredients;
  const steps = Array.isArray(recipe.steps) ? recipe.steps : ["Prep the ingredients.", "Cook until everything is tender.", "Taste, adjust, and serve warm."];
  return {
    id: recipe.id || `recipe-${index + 1}`,
    title: recipe.title || `Recipe Idea ${index + 1}`,
    summary: recipe.summary || "A practical recipe generated from your pantry list.",
    tags: Array.isArray(recipe.tags) ? recipe.tags : [request.filters.diet, request.filters.difficulty].filter((tag) => tag && tag !== "Any"),
    timeMinutes: Number(recipe.timeMinutes || 30),
    servings: Number(recipe.servings || request.filters.servings || 2),
    difficulty: recipe.difficulty || request.filters.difficulty,
    ingredients,
    steps,
    nutrition: {
      calories: recipe.nutrition?.calories || null,
      protein: recipe.nutrition?.protein || null,
    },
    mobile: {
      cardTitle: recipe.mobile?.cardTitle || recipe.title || `Recipe Idea ${index + 1}`,
      heroIcon: sanitizeIcon(recipe.mobile?.heroIcon, recipe.title || ingredients.join(" ")),
      primaryAction: "start_cooking",
    },
  };
}

function createLocalResponse(request) {
  const ingredients = request.ingredients;
  const main = ingredients[0] || "pantry";
  const second = ingredients[1] || "herb";
  const time = request.filters.time === "Any" ? 30 : parseInt(request.filters.time, 10) || 30;
  const tags = [request.filters.diet, request.filters.difficulty, request.filters.time].filter((tag) => tag && tag !== "Any");

  return {
    schemaVersion: "recipejoy.mobile.v1",
    generatedAt: new Date().toISOString(),
    source: "local-fallback",
    request,
    recipes: [
      normalizeRecipe({
        id: "bright-bowl",
        title: `Bright ${capitalize(main)} Bowl`,
        summary: `A colorful, low-effort bowl built around ${ingredients.slice(0, 4).join(", ")}.`,
        tags: ["Fresh", ...tags].slice(0, 4),
        timeMinutes: Math.min(time, 30),
        servings: request.filters.servings,
        difficulty: request.filters.difficulty,
        ingredients: [
          ...ingredients,
          "olive oil",
          "salt",
          "black pepper",
          "lemon or vinegar",
        ],
        steps: [
          `Prep ${ingredients.slice(0, 3).join(", ")} into bite-sized pieces.`,
          `Cook or warm the heartier ingredients, then season with olive oil, salt, and pepper.`,
          "Layer everything in bowls and finish with lemon or vinegar for brightness.",
        ],
        mobile: { heroIcon: "nutrition" },
      }, request, 0),
      normalizeRecipe({
        id: "one-pan-skillet",
        title: `One-Pan ${capitalize(main)} Skillet`,
        summary: `A cozy skillet meal that keeps cleanup small and flavor high.`,
        tags: ["One pan", ...tags].slice(0, 4),
        timeMinutes: Math.min(time + 5, 45),
        servings: request.filters.servings,
        difficulty: request.filters.difficulty,
        ingredients: [
          ...ingredients,
          "garlic or onion",
          "butter or olive oil",
          "stock or water",
        ],
        steps: [
          "Start aromatics in a wide skillet with butter or olive oil.",
          `Add ${main} and ${second}, then cook until browned at the edges.`,
          "Splash in stock or water, simmer briefly, and serve when glossy.",
        ],
        mobile: { heroIcon: "skillet" },
      }, request, 1),
      normalizeRecipe({
        id: "quick-wrap",
        title: `${capitalize(second)} Kitchen Wraps`,
        summary: `Fast handheld wraps for lunch, meal prep, or a no-fuss dinner.`,
        tags: ["Quick", ...tags].slice(0, 4),
        timeMinutes: Math.min(time, 20),
        servings: request.filters.servings,
        difficulty: "Easy",
        ingredients: [
          ...ingredients,
          "flatbread or tortillas",
          "yogurt sauce or hummus",
          "fresh herbs",
        ],
        steps: [
          "Warm flatbread until flexible.",
          `Pile on ${ingredients.slice(0, 4).join(", ")} with sauce and herbs.`,
          "Roll tightly, toast seam-side down, and slice before serving.",
        ],
        mobile: { heroIcon: "wrap_text" },
      }, request, 2),
    ],
  };
}

function renderRecipes() {
  els.empty.hidden = state.recipes.length > 0;
  els.recipes.innerHTML = state.recipes.map(recipeCard).join("");
}

function recipeCard(recipe) {
  const ingredients = recipe.ingredients.slice(0, 6).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const steps = recipe.steps.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const tags = recipe.tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("");
  return `
    <article class="recipe-card">
      <div class="recipe-visual">
        <span class="material-symbols-outlined">${escapeHtml(recipe.mobile.heroIcon)}</span>
      </div>
      <div class="recipe-body">
        <div class="chips">${tags}</div>
        <h3>${escapeHtml(recipe.title)}</h3>
        <p>${escapeHtml(recipe.summary)}</p>
        <div class="meta">
          <span><span class="material-symbols-outlined">schedule</span>${recipe.timeMinutes} min</span>
          <span><span class="material-symbols-outlined">groups</span>${recipe.servings} servings</span>
          <span><span class="material-symbols-outlined">local_dining</span>${escapeHtml(recipe.difficulty)}</span>
        </div>
        <div>
          <strong>Ingredients</strong>
          <ul>${ingredients}</ul>
        </div>
        <div>
          <strong>Steps</strong>
          <ol>${steps}</ol>
        </div>
      </div>
    </article>
  `;
}

async function copyLastPayload() {
  if (!state.lastPayload) return;
  await navigator.clipboard.writeText(JSON.stringify(state.lastPayload, null, 2));
  els.copyButton.innerHTML = '<span class="material-symbols-outlined">check</span>Copied';
  setTimeout(() => {
    els.copyButton.innerHTML = '<span class="material-symbols-outlined">content_copy</span>Copy JSON';
  }, 1400);
}

function setLoading(isLoading) {
  els.loading.hidden = !isLoading;
  els.form.querySelector(".generate").disabled = isLoading;
}

function chooseIcon(text) {
  const value = text.toLowerCase();
  if (value.includes("pan") || value.includes("skillet")) return "skillet";
  if (value.includes("bowl") || value.includes("salad")) return "nutrition";
  if (value.includes("soup")) return "soup_kitchen";
  if (value.includes("wrap") || value.includes("toast")) return "bakery_dining";
  return "restaurant";
}

function sanitizeIcon(icon, fallbackText = "") {
  const allowed = new Set([
    "restaurant",
    "skillet",
    "nutrition",
    "soup_kitchen",
    "bakery_dining",
    "ramen_dining",
    "local_pizza",
    "egg",
    "lunch_dining",
    "set_meal",
  ]);
  if (allowed.has(icon)) return icon;
  return chooseIcon(fallbackText);
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

init();
