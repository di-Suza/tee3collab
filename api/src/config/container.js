class ModuleContainer {
  constructor() {
    this.registry = new Map();
  }

  register(name, metadata = {}) {
    this.registry.set(name, Object.freeze({ name, ...metadata }));
    return this;
  }

  resolve(name) {
    return this.registry.get(name);
  }

  list() {
    return Array.from(this.registry.values());
  }
}

const container = new ModuleContainer()
  .register("auth", { owner: "Domain A", purpose: "Google auth and session bootstrap" })
  .register("rooms", { owner: "Domain A", purpose: "room create, join, host controls" })
  .register("documents", { owner: "Domain B", purpose: "document state and sync engine" })
  .register("presence", { owner: "Domain C", purpose: "participants and realtime presence" });

export { ModuleContainer };
export default container;
