import type React from "react";
import type { ReactNode } from "react";

import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";
import { vi } from "vitest";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

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

vi.mock("react-beautiful-dnd", () => ({
  DragDropContext: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  Droppable: ({
    children,
  }: {
    children: (provided: unknown, snapshot: unknown) => React.ReactNode;
  }) =>
    children(
      {
        draggableProps: {
          style: {},
        },
        innerRef: vi.fn(),
      },
      {},
    ),
  Draggable: ({
    children,
  }: {
    children: (provided: unknown, snapshot: unknown) => React.ReactNode;
  }) =>
    children(
      {
        draggableProps: {
          style: {},
        },
        innerRef: vi.fn(),
        dragHandleProps: {},
      },
      {},
    ),
}));
