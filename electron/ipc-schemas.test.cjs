const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseLaunchPayload,
  parseModsTogglePayload,
  parsePickFilePayload,
} = require("./ipc-schemas.cjs");

test("parseLaunchPayload валидирует запуск", () => {
  const payload = parseLaunchPayload({
    instance: {
      id: "1",
      name: "Main",
      version: "1.20.4",
      type: "release",
      created: Date.now(),
      playTime: 0,
    },
    settings: { gameDir: "C:/games/.zlauncher" },
  });
  assert.equal(payload.instance.name, "Main");
});

test("parseModsTogglePayload бросает ошибку для невалидного enabled", () => {
  assert.throws(() => parseModsTogglePayload({ fileName: "abc.jar", enabled: "yes" }), /enabled must be a boolean/);
});

test("parsePickFilePayload возвращает безопасный формат", () => {
  const result = parsePickFilePayload({
    filters: [{ name: "Mods", extensions: ["jar", 123] }],
  });
  assert.deepEqual(result, { filters: [{ name: "Mods", extensions: ["jar"] }] });
});
