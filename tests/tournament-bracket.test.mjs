import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Module from "node:module";
import ts from "typescript";
const testDirectory = path.dirname(fileURLToPath(import.meta.url));

function load(relative) {
  const filename = path.resolve(testDirectory, "..", relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loaded = new Module(filename);
  loaded._compile(compiled, filename);
  return loaded.exports;
}

const { createBracket, applyMatchUpdate, bracketChampion } = load("src/lib/tournament-bracket.ts");
const { validateHuntProgress } = load("src/lib/bonus-hunt.ts");

test("every field size from 2 to 64 finishes with exactly n-1 contested matches", () => {
  for (let count = 2; count <= 64; count++) {
    const names = Array.from({ length: count }, (_, i) => `Player ${i + 1}`);
    let matches = createBracket(names);
    let contested = 0;
    while (!bracketChampion(matches)) {
      const ready = matches.find((match) => match.status !== "COMPLETED" && match.participantA && match.participantB);
      assert.ok(ready, `Stalled bracket with ${count} players`);
      matches = applyMatchUpdate(matches, ready.round, ready.position, { winner: ready.participantA, scoreA: 2, scoreB: 1 });
      assert.ok(++contested < 64);
    }
    assert.equal(contested, count - 1);
    assert.ok(names.includes(bracketChampion(matches)));
    assert.equal(matches.filter((match) => match.status !== "COMPLETED").length, 0);
  }
});

test("byes are spread among seeds and waiting matches cannot be scored", () => {
  const matches = createBracket(["A", "B", "C", "D", "E"]);
  assert.equal(matches.filter((match) => match.round === 0 && match.status === "COMPLETED").length, 3);
  const waiting = matches.find((match) => match.round === 1 && (!match.participantA || !match.participantB));
  assert.throws(() => applyMatchUpdate(matches, waiting.round, waiting.position, { status: "LIVE" }), /Wait for both/);
  assert.equal(bracketChampion(matches), null);
});

test("correcting or resetting a semifinal invalidates its final and preserves the other semifinal", () => {
  let matches = createBracket(["A", "B", "C", "D"]);
  matches = applyMatchUpdate(matches, 0, 0, { winner: "A", scoreA: 2, scoreB: 0 });
  matches = applyMatchUpdate(matches, 0, 1, { winner: "B" });
  matches = applyMatchUpdate(matches, 1, 0, { winner: "A", scoreA: 3, scoreB: 1 });
  assert.equal(bracketChampion(matches), "A");
  matches = applyMatchUpdate(matches, 0, 0, { winner: "D", scoreA: 0, scoreB: 2 });
  assert.equal(bracketChampion(matches), null);
  assert.equal(matches.find((m) => m.round === 1).participantA, "D");
  assert.equal(matches.find((m) => m.round === 1).scoreA, null);
  assert.equal(matches.find((m) => m.round === 0 && m.position === 1).winner, "B");
  matches = applyMatchUpdate(matches, 0, 0, { winner: null });
  assert.equal(matches.find((m) => m.round === 1).participantA, null);
});

test("invalid entrants and results are rejected without mutating the input", () => {
  assert.throws(() => createBracket(["A"]), /between 2/);
  assert.throws(() => createBracket(["A", "B", "C"], 2), /between 2/);
  assert.throws(() => createBracket(["@Alice", "alice"]), /unique/);
  const matches = createBracket(["A", "B"]);
  const before = JSON.stringify(matches);
  for (const input of [{ winner: "X" }, { scoreA: -1 }, { scoreA: 0.5 }, { status: "COMPLETED" }, { winner: "A", scoreA: 1, scoreB: 1 }]) {
    assert.throws(() => applyMatchUpdate(matches, 0, 0, input));
  }
  assert.equal(JSON.stringify(matches), before);
});

test("hunt progress rejects opening more bonuses than planned", () => {
  assert.throws(() => validateHuntProgress({ bonusCount: 10, openedCount: 11 }), /cannot exceed/);
  assert.doesNotThrow(() => validateHuntProgress({ bonusCount: 0, openedCount: 0 }));
  assert.doesNotThrow(() => validateHuntProgress({ bonusCount: 10, openedCount: 10 }));
});
