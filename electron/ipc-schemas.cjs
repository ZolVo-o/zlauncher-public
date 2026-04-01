function asObject(payload, context) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`[${context}] Invalid payload object`);
  }
  return payload;
}

function asOptionalString(value, field, context) {
  if (value == null) return undefined;
  if (typeof value !== "string") throw new Error(`[${context}] ${field} must be a string`);
  return value;
}

function asString(value, field, context) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`[${context}] ${field} must be a non-empty string`);
  }
  return value;
}

function asBoolean(value, field, context) {
  if (typeof value !== "boolean") throw new Error(`[${context}] ${field} must be a boolean`);
  return value;
}

function parseLaunchPayload(payload) {
  const data = asObject(payload, "launcher:start");
  const instance = asObject(data.instance, "launcher:start");
  const settings = asObject(data.settings, "launcher:start");

  const type = asString(instance.type, "instance.type", "launcher:start");
  if (!["release", "snapshot", "modded"].includes(type)) {
    throw new Error("[launcher:start] instance.type has unsupported value");
  }
  if (instance.loader != null && !["vanilla", "fabric", "forge"].includes(String(instance.loader))) {
    throw new Error("[launcher:start] instance.loader has unsupported value");
  }

  asString(instance.id, "instance.id", "launcher:start");
  asString(instance.name, "instance.name", "launcher:start");
  asString(instance.version, "instance.version", "launcher:start");

  return {
    instance,
    settings,
  };
}

function parseGameDirPayload(payload, context) {
  const data = asObject(payload || {}, context);
  return { gameDir: asOptionalString(data.gameDir, "gameDir", context) };
}

function parseModsDeletePayload(payload) {
  const data = asObject(payload, "mods:delete");
  return {
    gameDir: asOptionalString(data.gameDir, "gameDir", "mods:delete"),
    fileName: asString(data.fileName, "fileName", "mods:delete"),
  };
}

function parseModsInstallPayload(payload) {
  const data = asObject(payload, "mods:install");
  return {
    gameDir: asOptionalString(data.gameDir, "gameDir", "mods:install"),
    sourcePath: asString(data.sourcePath, "sourcePath", "mods:install"),
    overwrite: typeof data.overwrite === "boolean" ? data.overwrite : false,
  };
}

function parseModsTogglePayload(payload) {
  const data = asObject(payload, "mods:toggle");
  return {
    gameDir: asOptionalString(data.gameDir, "gameDir", "mods:toggle"),
    fileName: asString(data.fileName, "fileName", "mods:toggle"),
    enabled: asBoolean(data.enabled, "enabled", "mods:toggle"),
  };
}

function parsePickFilePayload(payload) {
  if (payload == null) return { filters: [] };
  const data = asObject(payload, "dialog:pickFile");
  const filters = Array.isArray(data.filters) ? data.filters : [];
  return {
    filters: filters
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        name: typeof item.name === "string" ? item.name : "Files",
        extensions: Array.isArray(item.extensions) ? item.extensions.filter((ext) => typeof ext === "string") : [],
      })),
  };
}

module.exports = {
  parseLaunchPayload,
  parseGameDirPayload,
  parseModsDeletePayload,
  parseModsInstallPayload,
  parseModsTogglePayload,
  parsePickFilePayload,
};
