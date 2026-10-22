// Turn index.html into the file the Artifact host wants.
//   node tools/build-artifact.js <outfile>
// Two jobs:
//  1. Drop the document shell — the host supplies <!doctype>/<head>/<body> itself.
//  2. Drop the link-preview and home-screen meta. They do nothing inside an artifact
//     (the host builds its own preview) and og:/twitter: tags let a page dictate how
//     its link renders elsewhere, which a public-share check can reasonably refuse.
//     They stay in index.html, where they matter once the game is hosted for real.
const fs = require("fs");
const src = fs.readFileSync(__dirname + "/../index.html", "utf8");
let s = src;

s = s.replace(/^<!doctype html>\s*\n<html lang="en">\s*\n<head>\s*\n/i, "");
s = s.replace(/<meta charset="utf-8">\s*\n/i, "");
s = s.replace(/<\/head>\s*\n<body>\s*\n/i, "");
s = s.replace(/\n<\/body>\s*\n<\/html>\s*$/i, "\n");

const before = s.length;
s = s.replace(/^<link rel="apple-touch-icon"[^\n]*\n/mi, "");
// The host supplies the tab icon from the publish call's `favicon`, so the page's own
// <link rel="icon"> is redundant here — and an embedded image inside it is exactly what
// a public-share scan objects to (an inline <svg> data: URI can carry script). Drop it.
s = s.replace(/^<!-- A PNG, deliberately:[\s\S]*?-->\n/mi, "");
s = s.replace(/^<link rel="icon"[^\n]*\n/mi, "");
s = s.replace(/^<meta (?:name|property)="(?:(?:apple-)?mobile-web-app-[^"]*|application-name|theme-color|og:[^"]*|twitter:[^"]*)"[^\n]*\n/gmi, "");
s = s.replace(/^<!-- Add to Home Screen:[\s\S]*?-->\n/mi, "");
s = s.replace(/^<!-- Link previews\.[\s\S]*?-->\n/mi, "");

for (const bad of ["<!doctype", "<html", "<head>", "</head>", "<body>", "</body>", "</html>"])
  if (s.toLowerCase().includes(bad)) throw new Error("shell left behind: " + bad);
// (match the tags, not the substring — the game's own code contains "prog:1")
for (const bad of ['property="og:', 'name="twitter:', 'rel="apple-touch-icon"',
                   'mobile-web-app-capable', 'name="theme-color"', 'rel="icon"'])
  if (s.includes(bad)) throw new Error("meta left behind: " + bad);
if (!s.includes("<title>Fourfold Maze · Twenty Nights</title>")) throw new Error("lost the trial title");

// --safe: no clipboard writes, no <input>, no <textarea>. Same game otherwise.
if (process.argv.includes("--safe")){
  const flag = /const SAFE_MODE = false;   \/\*SAFE_FLAG\*\//;
  if (!flag.test(s)) throw new Error("SAFE_FLAG not found");
  s = s.replace(flag, "const SAFE_MODE = true;    /*SAFE_FLAG*/");
  // Guarding at runtime isn't enough — a scanner reads the text. Cut the literals out.
  const cut = (from, to) => {
    const a = s.indexOf(from); if (a < 0) throw new Error("safe: missing " + from.slice(0,40));
    const b = s.indexOf(to, a); if (b < 0) throw new Error("safe: unterminated " + from.slice(0,40));
    s = s.slice(0, a) + s.slice(b + to.length);
  };
  // stop BEFORE the trailing show() — that call is the whole fallback path
  cut("  if (!SAFE_MODE) try{\n    if (navigator.clipboard", "  }catch(e){}\n");
  cut("    if (!SAFE_MODE) try{\n      try{ out.focus", "    }catch(e){}\n");
  const swap = (a, b) => { if (!s.includes(a)) throw new Error("safe: missing " + a.slice(0,50));
                           s = s.replace(a, b); };
  swap(`    + (SAFE_MODE ? "" : q("4 · Anything you'd add or change? " + small("(optional)"))\n`
     + `        + '<textarea id="fbNote" rows="2" placeholder="I wish there was…"></textarea>')`, `    + ""`);
  swap(`    + (SAFE_MODE ? '<div id="fbOut" class="hidden outbox"></div>'\n`
     + `                 : '<textarea id="fbOut" class="hidden" readonly></textarea>');`,
       `    + '<div id="fbOut" class="hidden outbox"></div>';`);
  swap(`    + (SAFE_MODE ? "" : '<input id="bragName" maxlength="16" placeholder="Your name"'\n`
     + `                      + ' autocomplete="off" aria-label="Your name">')`, `    + ""`);
  swap(`    + (SAFE_MODE ? '<div id="bragOut" class="hidden outbox"></div>'\n`
     + `                 : '<textarea id="bragOut" class="hidden" readonly></textarea>');`,
       `    + '<div id="bragOut" class="hidden outbox"></div>';`);
  for (const bad of ["navigator.clipboard", "execCommand", "<textarea", "<input"])
    if (s.includes(bad)) throw new Error("safe build still contains: " + bad);
  // Their listeners have nothing left to bind. Exact text, not a lazy regex —
  // the first attempt at this ran on and swallowed the confetti function.
  swap('  const n = $("fbNote");\n'
     + '  if (n){ n.value = FB.note; n.addEventListener("input", () => { FB.note = n.value.slice(0,600); fbSave(); }); }\n', "");
  swap('  const n = $("bragName");\n'
     + '  if (n){\n'
     + '    n.value = bragName();\n'
     + '    n.addEventListener("input", () => { setBragName(n.value); paintBrag(); });\n'
     + '  }\n', "");
}

const out = process.argv.filter(a => a !== "--safe")[2];
if (!out) throw new Error("usage: node tools/build-artifact.js <outfile> [--safe]");
fs.writeFileSync(out, s);
console.log("built " + out + "  " + (s.length/1024).toFixed(0) + " KB"
          + "  (stripped " + (before - s.length) + " bytes of meta)");
