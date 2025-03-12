/*
* Как будет происходить кэнэри релиз
* 1) Workflow будет происходить после мерджа RR (кроме обновления зависимостей)
* 2) Формирование версии
* 3) Замена текущей версии на сформированную,
*    в пакетах и bun.lock workspace
* 4) Публикация пакетов
*/

// import { updateVersion } from "./helpers/update-version.js";

import rootPkg from "../package.json" with {type: "json"}
import BunLock from "../bun.lock"


const main = async () => {
  const canaryBase = rootPkg.version;
  const longCommit = process.env.SHA_COMMIT as string
  const shortCommit = longCommit.slice(0, 7);

  const version = `${canaryBase}.(${shortCommit})`;

  // await updateVersion(BunLock, version);
}

await main()