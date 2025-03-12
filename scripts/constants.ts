import { getEnv } from "./helpers/get-env.js";

export const isGithubAction = getEnv("GITHUB_ACTIONS", false) === "true";
export const githubApiUrl = getEnv("GITHUB_API_URL", false) || "https://api.github.com"