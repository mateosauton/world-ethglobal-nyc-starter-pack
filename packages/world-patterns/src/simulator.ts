import type { SimulatorResult } from "./outcomes";

export function createSimulatorResult<T>(
  fixture: string,
  value: T
): SimulatorResult<T> {
  if (!fixture.trim()) {
    throw new Error("Simulator results require a fixture name");
  }

  return { ok: true, mode: "simulator", fixture, value };
}
