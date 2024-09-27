import { v4 as uuidv4 } from "./uuid";

describe("UUID v4 Generation", () => {
  it("should generate a valid UUID v4 string", () => {
    const uuid = uuidv4();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("should generate unique UUIDs", () => {
    const uuids = new Set();
    for (let i = 0; i < 1000; i++) {
      uuids.add(uuidv4());
    }
    expect(uuids.size).toBe(1000);
  });

  it("should always have the version 4 identifier", () => {
    for (let i = 0; i < 100; i++) {
      const uuid = uuidv4();
      expect(uuid.charAt(14)).toBe("4");
    }
  });

  it("should always have the correct variant", () => {
    for (let i = 0; i < 100; i++) {
      const uuid = uuidv4();
      expect(["8", "9", "a", "b"]).toContain(uuid.charAt(19));
    }
  });
});
