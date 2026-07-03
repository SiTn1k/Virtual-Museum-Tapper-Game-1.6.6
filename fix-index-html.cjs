const { readFileSync, writeFileSync } = require('fs');

const indexPath = 'dist/index.html';
let content = readFileSync(indexPath, 'utf8');

// Check if already fixed (has React module script before closing body tag)
if (content.includes('type="module" crossorigin') && 
    content.includes('telegram-web-app.js') &&
    content.indexOf('type="module" crossorigin') > content.indexOf('telegram-web-app.js')) {
  console.log('Already fixed correctly!');
  process.exit(0);
}

// Find assets
const jsMatch = content.match(/src="(\/assets\/index-[^"]+\.js)"/);
const cssMatch = content.match(/href="(\/assets\/index-[^"]+\.css)"/);

const jsAsset = jsMatch ? jsMatch[1] : null;
const cssAsset = cssMatch ? cssMatch[1] : null;

if (!jsAsset || !cssAsset) {
  console.error('Could not find assets!');
  process.exit(1);
}

// Build the correct HTML structure
const fixedHTML = `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Jolt Time - Історична Тапалка</title>
    <meta name="description" content="Подорожуй крізь час 12 епохами історії України та світу! Збирай артефакти, відкривай генератори, перероджуйся та відкривай нові цивілізації!" />
    <meta name="theme-color" content="#1a1a2e" />
    <link rel="stylesheet" crossorigin href="${cssAsset}">
  </head>
  <body>
    <div id="root">
      <div class="initial-loader">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2">
          <circle cx="12" cy="12" r="10" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
        </svg>
        <p style="margin-top: 16px; opacity: 0.7;">Завантаження...</p>
      </div>
    </div>
    <script src="https://telegram.org/js/telegram-web-app.js"><\/script>
    <script src="https://sad.adsgram.ai/js/sad.min.js"><\/script>
    <script type="module" crossorigin src="${jsAsset}"><\/script>
  </body>
</html>`;

writeFileSync(indexPath, fixedHTML);
console.log('Fixed index.html!');
