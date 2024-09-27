import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import LoginWarningPopup from "./LoginWarningPopup";

interface GoogleLoginProps {
  onSuccess: (response: { credential: string }) => void;
  onError: () => void;
}

vi.mock("@react-oauth/google", () => ({
  GoogleLogin: ({ onSuccess }: GoogleLoginProps) => (
    <button
      onClick={() => onSuccess({ credential: "mock-credential" })}
      type="submit"
    >
      Google Login
    </button>
  ),
}));

describe("LoginWarningPopup", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the component with a button to show the popup", () => {
    render(<LoginWarningPopup />);
    expect(screen.getByText("Show Login Warning Popup")).toBeInTheDocument();
  });

  it("shows the popup when the button is clicked", () => {
    render(<LoginWarningPopup />);
    fireEvent.click(screen.getByText("Show Login Warning Popup"));
    expect(screen.getByText("Login Recommended")).toBeInTheDocument();
  });

  it("displays the warning message in the popup", () => {
    render(<LoginWarningPopup />);
    fireEvent.click(screen.getByText("Show Login Warning Popup"));
    expect(
      screen.getByText(
        "You are not logged in. Your test results won't be saved to your account.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a link to learn more about login benefits", () => {
    render(<LoginWarningPopup />);
    fireEvent.click(screen.getByText("Show Login Warning Popup"));
    expect(
      screen.getByText("Learn more about the benefits of logging in"),
    ).toBeInTheDocument();
  });

  it("displays the Google Login button", () => {
    render(<LoginWarningPopup />);
    fireEvent.click(screen.getByText("Show Login Warning Popup"));
    expect(screen.getByText("Google Login")).toBeInTheDocument();
  });

  it("shows a button to continue without logging in", () => {
    render(<LoginWarningPopup />);
    fireEvent.click(screen.getByText("Show Login Warning Popup"));
    expect(screen.getByText("Continue without logging in")).toBeInTheDocument();
  });

  it('closes the popup when "Continue without logging in" is clicked', async () => {
    render(<LoginWarningPopup />);
    fireEvent.click(screen.getByText("Show Login Warning Popup"));
    fireEvent.click(screen.getByText("Continue without logging in"));
    await waitFor(() => {
      expect(screen.queryByText("Login Recommended")).not.toBeInTheDocument();
    });
  });

  it('logs a message when "Learn more" is clicked', () => {
    render(<LoginWarningPopup />);
    fireEvent.click(screen.getByText("Show Login Warning Popup"));
    fireEvent.click(
      screen.getByText("Learn more about the benefits of logging in"),
    );
    expect(console.log).toHaveBeenCalledWith("Show more info about benefits");
  });

  it("handles successful Google login", async () => {
    render(<LoginWarningPopup />);
    fireEvent.click(screen.getByText("Show Login Warning Popup"));
    fireEvent.click(screen.getByText("Google Login"));
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith("Login successful", {
        credential: "mock-credential",
      });
    });
    expect(screen.queryByText("Login Recommended")).not.toBeInTheDocument();
  });
});
