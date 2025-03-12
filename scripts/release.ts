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


import rootPkg from "../package.json" with {type: "json"}
import BunLock from "../bun.lock"
import { getEnv } from "./helpers/get-env.js";
import type { BunLockFile } from "./types/bunlock.js";
import { join } from "path";

type PackageJson = {
  name: string;
  version: string;
}


const updateVersion = async (lock: BunLockFile, version: string) => {
  const info: Record<string, string[]> = {
    paths: [],
    names: []
  }

  Object.entries(lock.workspaces)
    .slice(1)
    .forEach(([path, workspace]) => {
      info.paths.push(path);
      info.names.push(workspace.name as string);
    });

  /* Rewrite bun.lock workspace packages versions */
  info.paths.forEach(path => lock.workspaces[path].version = version)

  await Bun.file("bun.lock").write(JSON.stringify(lock, null, 2));

  /* Rewrite packages versions */
  for (const path of info.paths) {
    const file = Bun.file(join(path, "package.json"))

    let pkg = await file.json() as PackageJson;

    pkg.version = version;

    await file.write(JSON.stringify(pkg, null, 2))
  }
}

const publishVersion = async () => {

}

const main = async () => {
  const tag = getEnv("RELEASE_TAG", true)

  if (tag === "canary") {
    await updateVersion(BunLock, tag)

    await Bun.$`bun ...`
  }

  const next = getEnv("NEXT_TAG", true)

  const latest = await Bun.file("LATEST").text()

  // if (!tag.startsWith("v")) throw new Error(`Release tag must be a valid version eg "v1.0.0"`)
  // if (!next.startsWith("v")) throw new Error(`Release tag must be a valid version eg "v1.0.0"`)

  if (tag !== rootPkg.version) throw new Error(`Tag must be match with root package version: tag: ${tag} root: ${rootPkg.version}`)

  if (Bun.semver.order(latest, tag) !== -1) throw new Error(`Release tag must be greater than latest: ${latest}`)
  if (Bun.semver.order(tag, next) !== -1) throw new Error(`Next tag must be greater than release tag: ${tag}`)

  await updateVersion(BunLock, tag);

  /* Write next version in root package.json */
  rootPkg.version = next;
  await Bun.file("package.json").write(JSON.stringify(rootPkg, null, 2));
}

await main()