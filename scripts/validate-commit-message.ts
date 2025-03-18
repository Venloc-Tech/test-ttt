const commitType = /(?<type>build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)/;
const commitScope = /(?<scope>\((?:@[a-z0-9._-]+\/[a-z0-9._-]+|[a-z0-9._-]+)(?:(?:;)(?:@[a-z0-9._-]+\/[a-z0-9._-]+|[a-z0-9._-]+))*\))/;
const commitBreaking = /(?<breaking>!)/;
const commitSubject = /(?<subject>.*)/;

const commitRegex = new RegExp(`^${commitType.source}${commitScope.source}?${commitBreaking.source}?:\\s${commitSubject.source}?`, "m");

const commitPath = Bun.argv[2];

if (!commitPath) {
  throw new Error(`[ERROR]: Commit message path not provided.`);
}

/* Read commit from file */
const commitFile = Bun.file(commitPath);
const commitMessage = await commitFile.text();

if (commitMessage.startsWith("@")) {
  console.log("[LOG]: User activate bypass for this commit.");
  console.log("[LOG]: Try to not use this feature and formalize\n commits according to the standard");
  console.log(`[LOG]: Your commit: ${commitMessage}`);
  /* Write commit to file without @ */
  await commitFile.write(commitMessage.slice(1));
  process.exit(0);
}

const matchTest = commitRegex.test(commitMessage);


if (!matchTest) {
  console.error(`[ERROR]: Invalid commit message -- ${commitMessage}\n Check our standard for commit messages.`);
  process.exit(1);
}

type CommitInfo = {
  type: string;
  scope: string | undefined;
  breaking: string | undefined;
  subject: string;
}

const groups = commitRegex.exec(commitMessage)!.groups as CommitInfo;

const info = Object
  .entries(groups)
  .map(([key, value]) => value ? `[LOG]: ${key}: ${value}` : "")
  .filter(Boolean)
  .join("\n");

const output = `[LOG]: Commit pass git commit-msg hook. Commit message contains:\n${info}`;

console.log(output);
