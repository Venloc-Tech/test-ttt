import { getRepository } from "./get-repository.js";
import { githubApiUrl } from "../constants.js";
import { getCommit } from "./get-commit.js";

import { curl } from "./curl.js";

export const getCanaryRevision = async (): Promise<number> => {
  const random = Math.floor(1000 + Math.random() * 9000)
  const repository = getRepository() as string;

  const repo_url = `${githubApiUrl}/repos/${repository}/releases/latest`

  const { error: releaseError, body: release } = await curl<{tag_name: any}>(repo_url);

  if (releaseError) return random;

  const commit = getCommit();

  const { tag_name: latest } = release;
  const compare_url = `${githubApiUrl}/repos/${repository}/compare/${latest}...${commit}`

  const { error: compareError, body: compare } = await curl<{ahead_by: any}>(compare_url);

  if (compareError) return random;

  const { ahead_by: revision } = compare;

  if (typeof revision === "number") return revision;


  return random;
}