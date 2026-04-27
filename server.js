const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const proxyBaseUrl = process.env.RECIPE_PROXY_BASE_URL || "http://127.0.0.1:8317";
const proxyConfigPath = process.env.RECIPE_PROXY_CONFIG || "C:\\Users\\zeyne\\Desktop\\AI\\cli-proxy\\config.yaml";
const proxyApiKey = process.env.RECIPE_PROXY_API_KEY || readFirstApiKey(proxyConfigPath);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      return sendJson(res, 200, {
        ok: true,
        proxyBaseUrl,
        hasProxyApiKey: Boolean(proxyApiKey),
      });
    }

    if (req.method === "POST" && url.pathname === "/api/recipes") {
      const body = await readJson(req);
      try {
        const recipes = await generateWithCliProxy(body);
        return sendJson(res, 200, recipes);
      } catch (error) {
        const fallback = createLocalResponse(body, error);
        return sendJson(res, 200, fallback);
      }
    }

    if (req.method !== "GET") {
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const filePath = resolvePublicPath(url.pathname);
    if (!filePath) {
      return sendJson(res, 404, { error: "Not found" });
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
});

server.listen(port, () => {
  console.log(`RecipeJoy app: http://127.0.0.1:${port}`);
  console.log(`CLI proxy upstream: ${proxyBaseUrl}/v1/chat/completions`);
});

function resolvePublicPath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const requested = cleanPath === "/" ? "/index.html" : cleanPath;
  const filePath = path.resolve(root, `.${requested}`);
  if (!filePath.startsWith(root)) return null;
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
  return filePath;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function readFirstApiKey(configPath) {
  try {
    const text = fs.readFileSync(configPath, "utf8");
    const match = text.match(/api-keys:\s*\r?\n\s*-\s*["']?([^"'\r\n]+)["']?/);
    return match?.[1]?.trim() || "";
  } catch {
    return "";
  }
}

async function generateWithCliProxy(request) {
  if (!proxyApiKey) {
    throw new Error("Missing RECIPE_PROXY_API_KEY");
  }

  const prompt = [
    "You are RecipeJoy, an AI recipe generator.",
    "Return only valid JSON matching this schema:",
    JSON.stringify(mobileSchema(), null, 2),
    "User request:",
    JSON.stringify(request, null, 2),
    "Rules: create exactly 3 practical recipes; use available ingredients heavily; include mobile fields; no markdown.",
  ].join("\n\n");

  const response = await fetch(`${proxyBaseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${proxyApiKey}`,
    },
    body: JSON.stringify({
      model: request.model || "chatgpt-5.5",
      messages: [
        {
          role: "system",
          content: "You output strict JSON only. No markdown fences.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`CLI proxy returned ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || data.output_text || "";
  const parsed = parseJsonContent(content);
  return normalizeResponse(parsed, request, "cli-proxy");
}

function parseJsonContent(content) {
  if (typeof content !== "string") {
    throw new Error("Proxy response content was not text");
  }
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(trimmed);
}

function mobileSchema() {
  return {
    schemaVersion: "recipejoy.mobile.v1",
    generatedAt: "ISO-8601 string",
    source: "cli-proxy",
    recipes: [
      {
        id: "stable-slug",
        title: "Recipe title",
        summary: "One sentence",
        tags: ["Quick", "High protein"],
        timeMinutes: 25,
        servings: 2,
        difficulty: "Easy",
        ingredients: ["ingredient with amount"],
        steps: ["short actionable step"],
        nutrition: { calories: 520, protein: "34g" },
        mobile: {
          cardTitle: "Short title",
          heroIcon: "skillet",
          primaryAction: "start_cooking",
        },
      },
    ],
  };
}

function normalizeResponse(response, request, source) {
  const recipes = Array.isArray(response) ? response : response.recipes;
  if (!Array.isArray(recipes)) {
    throw new Error("Model did not return recipes array");
  }
  return {
    schemaVersion: response.schemaVersion || "recipejoy.mobile.v1",
    generatedAt: response.generatedAt || new Date().toISOString(),
    source,
    request,
    recipes: recipes.slice(0, 3).map((recipe, index) => ({
      id: recipe.id || `recipe-${index + 1}`,
      title: recipe.title || `Recipe ${index + 1}`,
      summary: recipe.summary || "A practical recipe from your pantry.",
      tags: Array.isArray(recipe.tags) ? recipe.tags : [],
      timeMinutes: Number(recipe.timeMinutes || 30),
      servings: Number(recipe.servings || request.filters?.servings || 2),
      difficulty: recipe.difficulty || request.filters?.difficulty || "Easy",
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : request.ingredients || [],
      steps: Array.isArray(recipe.steps) ? recipe.steps : [],
      nutrition: recipe.nutrition || { calories: null, protein: null },
      mobile: {
        cardTitle: recipe.mobile?.cardTitle || recipe.title || `Recipe ${index + 1}`,
        heroIcon: sanitizeIcon(recipe.mobile?.heroIcon, recipe.title || recipe.summary || ""),
        primaryAction: recipe.mobile?.primaryAction || "start_cooking",
      },
    })),
  };
}

function createLocalResponse(request, error) {
  const ingredients = Array.isArray(request.ingredients) ? request.ingredients : [];
  const main = ingredients[0] || "pantry";
  const second = ingredients[1] || "herb";
  const servings = Number(request.filters?.servings || 2);
  const difficulty = request.filters?.difficulty || "Easy";
  const tags = [request.filters?.diet, difficulty, request.filters?.time].filter((tag) => tag && tag !== "Any");

  return normalizeResponse({
    schemaVersion: "recipejoy.mobile.v1",
    generatedAt: new Date().toISOString(),
    source: "local-fallback",
    recipes: [
      {
        id: "bright-bowl",
        title: `Bright ${capitalize(main)} Bowl`,
        summary: `A colorful bowl using ${ingredients.slice(0, 4).join(", ") || "your pantry staples"}.`,
        tags: ["Fresh", ...tags].slice(0, 4),
        timeMinutes: 25,
        servings,
        difficulty,
        ingredients: [...ingredients, "olive oil", "salt", "black pepper", "lemon"],
        steps: ["Prep everything into bite-sized pieces.", "Cook the heartier ingredients until tender.", "Layer in bowls and finish with lemon."],
        nutrition: { calories: 520, protein: "24g" },
        mobile: { cardTitle: "Bright Bowl", heroIcon: "nutrition", primaryAction: "start_cooking" },
      },
      {
        id: "one-pan-skillet",
        title: `One-Pan ${capitalize(main)} Skillet`,
        summary: "A cozy skillet recipe that keeps cleanup small.",
        tags: ["One pan", ...tags].slice(0, 4),
        timeMinutes: 30,
        servings,
        difficulty,
        ingredients: [...ingredients, "garlic", "stock or water", "butter or olive oil"],
        steps: [`Sizzle garlic, then add ${main} and ${second}.`, "Cook until browned at the edges.", "Add a splash of stock and simmer until glossy."],
        nutrition: { calories: 610, protein: "31g" },
        mobile: { cardTitle: "One-Pan Skillet", heroIcon: "skillet", primaryAction: "start_cooking" },
      },
      {
        id: "quick-wraps",
        title: `${capitalize(second)} Kitchen Wraps`,
        summary: "Fast handheld wraps for lunch or dinner.",
        tags: ["Quick", ...tags].slice(0, 4),
        timeMinutes: 18,
        servings,
        difficulty: "Easy",
        ingredients: [...ingredients, "flatbread", "yogurt sauce or hummus", "fresh herbs"],
        steps: ["Warm the flatbread.", "Pile on ingredients with sauce and herbs.", "Roll tightly and toast until crisp."],
        nutrition: { calories: 480, protein: "22g" },
        mobile: { cardTitle: "Kitchen Wraps", heroIcon: "bakery_dining", primaryAction: "start_cooking" },
      },
    ],
    error: error?.message,
  }, request, "local-fallback");
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
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
  const text = fallbackText.toLowerCase();
  if (text.includes("soup")) return "soup_kitchen";
  if (text.includes("wrap") || text.includes("toast")) return "bakery_dining";
  if (text.includes("bowl") || text.includes("salad")) return "nutrition";
  if (text.includes("fish") || text.includes("salmon")) return "set_meal";
  if (text.includes("pan") || text.includes("skillet")) return "skillet";
  return "restaurant";
}
