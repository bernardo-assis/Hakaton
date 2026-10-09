import test from "node:test";
import assert from "node:assert/strict";
import { SimulationControl } from "../src/lib/simulationControl.ts";
test("stop cancels in-flight work and persisted running state survives a new controller", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const control = new SimulationControl(storage);
  control.start();
  assert.equal(new SimulationControl(storage).running, true);
  const signal = control.begin();
  assert.equal(signal.aborted, false);
  control.stop();
  assert.equal(signal.aborted, true);
  assert.equal(new SimulationControl(storage).running, false);
  assert.throws(() => control.begin(), /inicie/i);
});
