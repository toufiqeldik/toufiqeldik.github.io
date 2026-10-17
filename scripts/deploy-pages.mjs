// Publishes the contents of public/ to the gh-pages branch, which GitHub Pages
// serves at the domain root (https://toufiqeldik.github.io).
//
// Written in Node rather than bash so it behaves the same on Windows, macOS and
// Linux. Run it with `npm run deploy:pages`.
import { execFileSync } from "node:child_process";

const run = (args, opts = {}) =>
  execFileSync("git", args, { stdio: "inherit", ...opts });

const capture = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();

const check = (description, args) => {
  try {
    return capture(args);
  } catch {
    console.error(`Could not run git ${args.join(" ")} (${description}).`);
    process.exit(1);
  }
};

const remote = process.argv[2] ?? "origin";
const branch = process.argv[3] ?? "gh-pages";

const remotes = check("list remotes", ["remote"]).split("\n").filter(Boolean);
if (!remotes.includes(remote)) {
  console.error(
    `No git remote called "${remote}". Found: ${remotes.join(", ") || "none"}.`,
  );
  process.exit(1);
}

// The deployed site should always match a commit, never a half-finished edit.
const dirty = check("check status", ["status", "--porcelain"]);
if (dirty) {
  const preview = dirty
    .split("\n")
    .slice(0, 10)
    .map((line) => "  " + line)
    .join("\n");
  console.error(
    "Working tree has uncommitted changes. Commit them first, so the live site\n" +
      "always matches something you can point back to.\n\n" +
      preview,
  );
  process.exit(1);
}

console.log("Checking the site before publishing...\n");
execFileSync(process.execPath, ["scripts/check-site.mjs"], { stdio: "inherit" });

console.log(`\nPushing public/ to ${remote}/${branch}...\n`);
run(["subtree", "push", "--prefix", "public", remote, branch]);

console.log(
  `\nPushed. GitHub Pages rebuilds https://toufiqeldik.github.io/ in about a minute.`,
);
