function splitArgs(raw) {
  if (!raw || typeof raw !== "string") return [];
  const result = [];
  let token = "";
  let quote = null;
  let escaping = false;

  for (const char of raw) {
    if (escaping) {
      token += char;
      escaping = false;
      continue;
    }

    if (char === "\\") {
      escaping = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        token += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (token) {
        result.push(token);
        token = "";
      }
      continue;
    }

    token += char;
  }

  if (escaping) token += "\\";
  if (token) result.push(token);
  return result;
}

function detectRequiredJavaMajor(mcVersion) {
  const match = String(mcVersion || "").match(/^(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return 17;
  const minor = Number(match[2] || 0);
  const patch = Number(match[3] || 0);

  if (minor > 20 || (minor === 20 && patch >= 5)) return 21;
  if (minor >= 18) return 17;
  return 8;
}

function normalizeErrorMessage(error) {
  const raw = error?.message || String(error);
  const text = String(raw);

  if (/ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNRESET|ECONNREFUSED|certificate|SSL/i.test(text)) {
    return `${text}\nПодсказка: ошибка сети при скачивании. Проверь VPN/прокси/фаервол и доступ к серверам Mojang.`;
  }
  if (/java/i.test(text) && /not found|ENOENT|spawn/i.test(text)) {
    return `${text}\nПодсказка: Java не найдена. Включи автоустановку зависимостей или укажи путь к Java 17+ в настройках.`;
  }
  if (/class file version|UnsupportedClassVersionError|requires Java|invalid java runtime/i.test(text)) {
    return `${text}\nПодсказка: версия Java не подходит для выбранной версии Minecraft. Попробуй включить автоустановку зависимостей.`;
  }
  if (/EACCES|EPERM|permission|Access is denied/i.test(text)) {
    return `${text}\nПодсказка: нет прав на запись в папку игры. Выбери другую папку в настройках.`;
  }
  if (/version|manifest|json/i.test(text)) {
    return `${text}\nПодсказка: не удалось скачать метаданные версии. Выбери другую версию и повтори попытку.`;
  }
  return text;
}

module.exports = {
  splitArgs,
  detectRequiredJavaMajor,
  normalizeErrorMessage,
};
