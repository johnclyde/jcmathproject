import { vi } from "vitest";

vi.mock("firebase/app", () => {
  const auth = {
    onAuthStateChanged: vi.fn(),
  };
  return {
    initializeApp: vi.fn(),
    getApps: vi.fn(vi.fn()),
    getApp: vi.fn(),
    auth: vi.fn(() => auth),
  };
});

vi.mock("firebase/auth", () => {
  const auth = {
    onAuthStateChanged: vi.fn(),
    currentUser: null,
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  };

  return {
    getAuth: vi.fn(() => auth),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    GoogleAuthProvider: vi.fn(),
  };
});

vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(),
}));

vi.mock("../firebase", () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
  },
  getIdToken: vi.fn(() => Promise.resolve("mocked-id-token")),
}));
