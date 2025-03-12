import { getEnv } from "./get-env.js";
import { isGithubAction } from "../constants.js";


export const getCommit = () => {
  if (isGithubAction) return getEnv("GITHUB_SHA", true);
}