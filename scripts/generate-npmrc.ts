import path from "path";

import bunfig from "../bunfig.toml";

interface ScopeConfigObject {
  url: string;
  token?: string;
  username?: string;
  password?: string;
}

function parseRegistryUrl(rawUrl: string): { registryUrl: string; host: string } {
  try {
    // Используем встроенный URL для парсинга
    const parsedUrl = new URL(rawUrl);
    // Собираем чистый url без авторизации
    const registryUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}`;
    // Для .npmrc нам понадобится хост в виде //registry.myorg.com/
    const host = `//${parsedUrl.host}${parsedUrl.pathname}`;
    return { registryUrl, host };
  } catch (error) {
    console.log(error);
    throw new Error(`Неверный URL: ${rawUrl}`);
  }
}

function processScope(scope: string, config: string | ScopeConfigObject): string {
  const npmrcLines: string[] = [];
  let registryUrl: string;
  const authLines: string[] = [];

  if (typeof config === "string") {
    // Если задана строка, возможно, содержит уже встроенные учётные данные
    const { registryUrl: cleanUrl, host } = parseRegistryUrl(config);
    registryUrl = cleanUrl;
    npmrcLines.push(`@${scope}:registry=${registryUrl}`);

    // Если в URL заданы учётные данные, попробуем их извлечь
    try {
      const parsedUrl = new URL(config);
      if (parsedUrl.username || parsedUrl.password) {
        if (parsedUrl.username) authLines.push(`${host}:username=${parsedUrl.username}`);
        if (parsedUrl.password) authLines.push(`${host}:_password=${parsedUrl.password}`);
      }
    } catch (error) {
      console.log(error);
      // Ошибка парсинга URL уже обработана выше
    }
  } else {
    // Если задан объект
    const { url, token, username, password } = config;
    const { registryUrl: cleanUrl, host } = parseRegistryUrl(url);
    registryUrl = cleanUrl;
    npmrcLines.push(`@${scope}:registry=${registryUrl}`);
    if (token) {
      authLines.push(`${host}:_authToken=${token}`);
    } else if (username && password) {
      authLines.push(`${host}:username=${username}`);
      authLines.push(`${host}:_password=${password}`);
    }
  }

  return [...npmrcLines, ...authLines].join("\n");
}

type ParsedToml = {install: {scopes: Record<string, string | ScopeConfigObject>}}

async function generateNpmrc(npmrcPath: string): Promise<void> {

  const parsedToml: ParsedToml = bunfig as ParsedToml;

  if (!parsedToml.install || !parsedToml.install.scopes) {
    return console.error("В bunfig.toml отсутствует секция install.scopes");
  }

  const scopes = parsedToml.install.scopes;
  const outputLines: string[] = [];

  console.log(scopes);

  for (const [scope, config] of Object.entries(scopes)) {
    console.log(scope, config);
    try {
      const section = processScope(scope, config);
      outputLines.push(section);
    } catch (error) {
      console.error(`Ошибка обработки скоупа ${scope}:`, error);
    }
  }

  const outputContent = outputLines.join("\n\n");
  await Bun.file(npmrcPath).write(outputContent);
  // Fs.writeFileSync(npmrcPath, outputContent, "utf8");
  console.log(`Файл .npmrc сгенерирован по пути ${npmrcPath}`);
}

// Пути к файлам (можно настроить при необходимости)
const npmrcPath = path.join(process.cwd(), ".npmrc");

await generateNpmrc(npmrcPath);
