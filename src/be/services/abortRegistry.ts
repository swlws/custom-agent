const registry = new Map<string, AbortController>();

export function registerAbort(uid: string): AbortSignal {
  registry.get(uid)?.abort();
  const controller = new AbortController();
  registry.set(uid, controller);
  return controller.signal;
}

export function abortByUid(uid: string): void {
  registry.get(uid)?.abort();
  registry.delete(uid);
}

export function releaseAbort(uid: string): void {
  registry.delete(uid);
}
