interface SessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export class SimulationControl {
  private storage: SessionStorage;
  private controller?: AbortController;
  running: boolean;
  constructor(storage: SessionStorage) {
    this.storage = storage;
    this.running = storage.getItem("agentsafe.simulator.running") === "true";
  }
  start() {
    this.running = true;
    this.storage.setItem("agentsafe.simulator.running", "true");
  }
  stop() {
    this.running = false;
    this.storage.setItem("agentsafe.simulator.running", "false");
    this.cancel();
  }
  cancel() {
    this.controller?.abort();
    this.controller = undefined;
  }
  begin() {
    if (!this.running)
      throw new Error("Inicie o simulador antes de disparar uma ação.");
    this.cancel();
    this.controller = new AbortController();
    return this.controller.signal;
  }
}
