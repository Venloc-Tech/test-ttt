import { getEnv } from "./get-env.js";
import { isGithubAction } from "../constants.js";


export const getRepository = () => {
  if (isGithubAction) return getEnv("GITHUB_REPOSITORY", true);
}