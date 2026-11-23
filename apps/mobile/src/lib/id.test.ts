import { createId } from "./id";

jest.mock("expo-crypto", () => ({
  getRandomBytes: (size: number) => {
    const out = new Uint8Array(size);
    for (let i = 0; i < size; i++) out[i] = (i * 37 + 11) % 256;
    return out;
  },
}));

describe("createId", () => {
  it("generates valid UUIDv7-formatted client IDs", () => {
    const id = createId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
