# RecipeJoy Generator

Proxy-ready AI recipe generator prototype using a local Node server and the existing CLI proxy.

## Run

```powershell
npm install
npm start
```

Open:

```text
http://127.0.0.1:3000
```

## CLI Proxy

The browser calls the local app server at `/api/recipes`. The app server forwards generation requests to:

```text
http://127.0.0.1:8317/v1/chat/completions
```

Default model:

```text
chatgpt-5.5
```

You can override settings with:

```powershell
$env:RECIPE_PROXY_BASE_URL="http://127.0.0.1:8317"
$env:RECIPE_PROXY_API_KEY="your-key"
$env:PORT="3000"
npm start
```

## Schema

Responses normalize to:

```text
recipejoy.mobile.v1
```

This keeps the web prototype compatible with a future mobile app response contract.

## Test

```powershell
npm test
```

The smoke test opens the app, generates recipes, verifies cards render, and writes desktop/mobile screenshots.
