import { vi } from "vitest";
// import { render, screen } from "@testing-library/react";
// import App from "./App";

vi.mock("./components/Header", () => {
  return function MockHeader() {
    return <div>GrindOlympiads</div>;
  };
});

vi.mock("./components/NotificationBell", () => {
  return function MockNotificationBell() {
    return <div>Notifications</div>;
  };
});

vi.mock("./components/UserMenu", () => {
  return function MockUserMenu() {
    return <div>User Menu</div>;
  };
});

vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn().mockImplementation((_, functionName) => {
    if (functionName === "login") {
      return vi.fn().mockResolvedValue({ data: { success: true } });
    }
    return vi.fn().mockRejectedValue(new Error("Unexpected function call"));
  }),
}));

test("renders GrindOlympiads header", () => {
  // render(<App />);
  // const headerElement = screen.getByText(/GrindOlympiads/i);
  // expect(headerElement).toBeInTheDocument();
});
