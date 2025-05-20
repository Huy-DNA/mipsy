export class Code {
  // Map a word-aligned address to a word (4 bytes)
  private mem: Map<number, number>;

  constructor() {
    this.mem = new Map<number, number>();
  }

  private alignAddressToWordBoundary(address: number): number {
    return Math.floor(address / 4) * 4;
  }

  storeByte(address: number, byte: number): void {
    byte = byte & 0xFF;

    const wordAddress = this.alignAddressToWordBoundary(address);

    let word = this.mem.get(wordAddress) || 0;

    const bytePosition = address % 4;

    const clearMask = ~(0xFF << (bytePosition * 8));
    word = word & clearMask;

    word = word | (byte << (bytePosition * 8));

    this.mem.set(wordAddress, word);
  }

  storeHalfWord(address: number, halfword: number): void {
    if (address % 2 !== 0) {
      throw new Error("Address must be half-word aligned");
    }

    halfword = halfword & 0xFFFF;

    const wordAddress = this.alignAddressToWordBoundary(address);

    let word = this.mem.get(wordAddress) || 0;

    const halfwordPosition = (address % 4) / 2;

    const clearMask = ~(0xFFFF << (halfwordPosition * 16));
    word = word & clearMask;

    word = word | (halfword << (halfwordPosition * 16));

    this.mem.set(wordAddress, word);
  }

  storeWord(address: number, word: number): void {
    if (address % 4 !== 0) {
      throw new Error("Address must be word aligned");
    }

    this.mem.set(address, word);
  }

  readByte(address: number): number {
    const wordAddress = this.alignAddressToWordBoundary(address);

    const word = this.mem.get(wordAddress) || 0;

    const bytePosition = address % 4;

    return (word >> (bytePosition * 8)) & 0xFF;
  }

  readHalfWord(address: number): number {
    if (address % 2 !== 0) {
      throw new Error("Address must be half-word aligned");
    }

    const wordAddress = this.alignAddressToWordBoundary(address);

    const word = this.mem.get(wordAddress) || 0;

    const halfwordPosition = (address % 4) / 2;

    return (word >> (halfwordPosition * 16)) & 0xFFFF;
  }

  readWord(address: number): number {
    if (address % 4 !== 0) {
      throw new Error("Address must be word aligned");
    }

    return this.mem.get(address) || 0;
  }
}
