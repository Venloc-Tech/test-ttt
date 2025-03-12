/*
* Как будет происходить релиз
* 1) Workflow будет запускать в ручную, указываются версия и след версия
* 2) Обновляем версию в соответствие с публикуемой во всех пакетах
*    также меняем ее в bun.lock workspace. Добавляем след
*    версию в файл (мб в корневой package.json)
* 3) Публикуем пакеты
* 4) Создаем тег версии
* 5) Делаем коммит и пушим в репозиторий
*/

/*
* Как будет происходить кэнэри релиз
* 1) Workflow будет происходить после мерджа RR (кроме обновления зависимостей)
* 2) Формирование версии
* 3) Замена текущей версии на сформированную,
*    в пакетах и bun.lock workspace
* 4) Публикация пакетов
*/


import { cwd } from "process";
import { join } from "path";

import { dateFormatter } from "./helpers/date-format.js";
import type { BunLockFile } from "./types/bunlock.js";
import { getEnv } from "./helpers/get-env.js";

import rootPkg from "../package.json" with {type: "json"};
import BunLock from "../bun.lock";


type PackageJson = {
  name: string;
  version: string;
}

// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
type PublishPlatform = "npm" | "github" | string

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getRegistry = (platform: PublishPlatform) => {
  switch (platform) {
    case "github":
      return "https://npm.pkg.github.com";
    case "npm":
      return "https://registry.npmjs.org/";

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
};


class ReleaseManager {
  static async getCanaryVersion(latest: string) {
    const sha = getEnv("SHA_COMMIT", true).slice(0, 7);
    const previousSha = await Bun.file("LATEST_CANARY").text();

    if (sha === previousSha) {
      console.log("[LOG]: Current commit sha is equal to latest published canary sha");
      return process.exit(0);
    }

    const date = dateFormatter.format(new Date());

    return `${latest}-${date}-${sha}`;
  }

  static getVersion(latest: string) {
    const next = getEnv("NEXT_VERSION", true);
    const extraVersion = getEnv("EXTRA_VERSION", false);
    const newVersion = rootPkg.version;

    const version = extraVersion ? extraVersion : newVersion;
    
    if (Bun.semver.order(latest, version) !== -1) throw new Error(`Release version must be greater than latest: ${latest}`);
    if (Bun.semver.order(version, next) !== -1) throw new Error(`Next version must be greater than release version: ${version}`);

    return [version, next];
  }

  static getPackagesPaths(lock: BunLockFile) {
    return Object.keys(lock.workspaces).slice(1);
  }
  
  static async update(lock: BunLockFile, packagesPaths: string[], version: string) {
    /* Rewrite bun.lock workspace packages versions */
    packagesPaths.forEach(path => lock.workspaces[path].version = version);

    await Bun.file("bun.lock").write(JSON.stringify(lock, null, 2));

    /* Rewrite packages versions */
    for (const path of packagesPaths) {
      const file = Bun.file(join(path, "package.json"));

      const pkg = await file.json() as PackageJson;

      console.log(`[LOG]: Change ${pkg.name} version: ${pkg.version} -> (${version})`);

      pkg.version = version;

      await file.write(JSON.stringify(pkg, null, 2));
    }
  }
  
  static async publish(packagesPaths: string[], isCanary: boolean) {
    const tag = isCanary ? "canary" : "latest";

    const configPath = join(cwd(), "bunfig.toml");

    const isConfigExist = await Bun.file(configPath).exists();

    const configArg = isConfigExist ? `-c ${configPath}` : "";

    const args = `--tag ${tag} ${configArg}`;

    console.log(args, `bun publish ${args} --dry-run`, `bun publish --tag ${tag} ${configArg} --dry-run`);

    for (const path of packagesPaths) {
      try {
        await Bun.$`bun publish --tag ${tag} ${configArg} --dry-run`.cwd(path);
      } catch (e) {
        throw new Error(`An unknown error was occurred with path - ${path}: ${e as string}`);
      }
    }

    // Process.exit(1);
  }

  static async save(version: string, isCanary: boolean) {
    const file = isCanary ? "LATEST_CANARY" : "LATEST";

    await Bun.file(file).write(version);
  }
}

const main = async (): Promise<void> => {
  if (!await Bun.file("LATEST").exists()) throw new Error("Couldn't find LATEST file");
  if (!await Bun.file("LATEST_CANARY").exists()) throw new Error("Couldn't find LATEST_CANARY file");

  const isCanary = getEnv("IS_CANARY", true) === "true";
  console.log("DEBUG IS_CANARY: ", isCanary, isCanary ? "canary" : "latest");

  const latest = await Bun.file("LATEST").text();

  const packagesPaths = ReleaseManager.getPackagesPaths(BunLock);

  const [version, next] = isCanary
    ? [await ReleaseManager.getCanaryVersion(latest), undefined]
    : ReleaseManager.getVersion(latest);
  
  if (isCanary) {
    const canaryStopList = getEnv("CANARY_STOP_VERSIONS", false).split("|") || [];
    
    if (canaryStopList.length !== 0 && canaryStopList.includes(version)) {
      console.log(`[LOG]: This version (${latest}) in canary stop list (won't be publish)`);
      process.exit(0);
    }
  }

  await ReleaseManager.update(BunLock, packagesPaths, version);
  await ReleaseManager.publish(packagesPaths, isCanary);
  await ReleaseManager.save(version, isCanary);

  if (!isCanary) {
    /* Write next version in root package.json */
    rootPkg.version = next as string;
    await Bun.file("package.json").write(JSON.stringify(rootPkg, null, 2));
  }
};

await main();