export interface NullifierStore {
  tryRecord(nullifierHash: string, action: string): boolean;
  has(nullifierHash: string, action: string): boolean;
}

export class MemoryNullifierStore implements NullifierStore {
  private readonly seen = new Set<string>();

  tryRecord(nullifierHash: string, action: string): boolean {
    const key = this.key(nullifierHash, action);

    if (this.seen.has(key)) {
      return false;
    }

    this.seen.add(key);
    return true;
  }

  has(nullifierHash: string, action: string): boolean {
    return this.seen.has(this.key(nullifierHash, action));
  }

  private key(nullifierHash: string, action: string): string {
    return `${action}:${nullifierHash.toLowerCase()}`;
  }
}

