// Build every derived file from the one source of truth, index.html.
//   node tools/build.js
// Nothing this writes belongs in git — regenerate it, don't commit it. Keeping
// generated copies under version control means every design-variant branch
// conflicts on files nobody edited.
const { execFileSync } = require("child_process");
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const run = (...args) => execFileSync(process.execPath, args, { cwd: root, stdio: "inherit" });

fs.mkdirSync(path.join(root, "assets"), { recursive: true });
fs.mkdirSync(path.join(root, "dist"),   { recursive: true });

// 1 · icons, drawn from the game's palette
run("tools/makeicon.js", "512", "assets/twenty-nights-icon.png");
run("tools/makeicon.js", "180", "assets/apple-touch-icon.png");

// 2 · the file you send to a friend — same game, a name they'll recognise
fs.copyFileSync(path.join(root, "index.html"), path.join(root, "Twenty Nights.html"));

// 3 · the hostable copy: icons beside it, and a link preview that can resolve
const src = fs.readFileSync(path.join(root, "index.html"), "utf8");
const card = '<meta name="twitter:card" content="summary_large_image">';
if (!src.includes(card)) throw new Error("twitter:card meta missing from index.html");
fs.writeFileSync(path.join(root, "dist", "index.html"), src.replace(card,
  '<meta property="og:image" content="twenty-nights-icon.png">\n' + card +
  '\n<meta name="twitter:image" content="twenty-nights-icon.png">'));
for (const f of ["twenty-nights-icon.png", "apple-touch-icon.png"])
  fs.copyFileSync(path.join(root, "assets", f), path.join(root, "dist", f));

// 4 · the artifact copy: shell and preview meta stripped (see build-artifact.js)
run("tools/build-artifact.js", "dist/artifact.html");

console.log("\nbuilt: assets/ · Twenty Nights.html · dist/");
