const test = require("node:test");
const assert = require("node:assert/strict");
const {
  splitArgs,
  detectRequiredJavaMajor,
  normalizeErrorMessage,
} = require("./launcher-utils.cjs");

test("splitArgs корректно разбирает кавычки и пробелы", () => {
  const args = splitArgs("-Xmx4G --username 'Test User' --flag=ok");
  assert.deepEqual(args, ["-Xmx4G", "--username", "Test User", "--flag=ok"]);
});

test("detectRequiredJavaMajor возвращает Java 21 для 1.20.5+", () => {
  assert.equal(detectRequiredJavaMajor("1.20.4"), 17);
  assert.equal(detectRequiredJavaMajor("1.20.5"), 21);
  assert.equal(detectRequiredJavaMajor("1.21.1"), 21);
});

test("normalizeErrorMessage добавляет подсказку для сетевой ошибки", () => {
  const result = normalizeErrorMessage(new Error("ETIMEDOUT while fetching"));
  assert.match(result, /ошибка сети/i);
});
