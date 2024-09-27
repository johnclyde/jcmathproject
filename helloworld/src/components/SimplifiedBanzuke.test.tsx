import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import SimplifiedBanzuke from "./SimplifiedBanzuke";

describe("SimplifiedBanzuke", () => {
  test("renders the component title", () => {
    render(<SimplifiedBanzuke />);
    expect(screen.getByText("Simplified Banzuke")).toBeInTheDocument();
  });

  test("renders all initial rikishi", () => {
    render(<SimplifiedBanzuke />);
    expect(screen.getByText("Terunofuji")).toBeInTheDocument();
    expect(screen.getByText("Hoshoryu")).toBeInTheDocument();
    expect(screen.getByText("Kotozakura")).toBeInTheDocument();
    expect(screen.getByText("Takakeisho")).toBeInTheDocument();
    expect(screen.getByText("Kirishima")).toBeInTheDocument();
  });

  test("displays correct ranks for rikishi", () => {
    render(<SimplifiedBanzuke />);
    expect(screen.getByText("Y1e")).toBeInTheDocument();
    expect(screen.getByText("O1e")).toBeInTheDocument();
    expect(screen.getByText("O1w")).toBeInTheDocument();
    expect(screen.getByText("O2e")).toBeInTheDocument();
    expect(screen.getByText("O2w")).toBeInTheDocument();
  });

  test("displays correct win-loss records", () => {
    render(<SimplifiedBanzuke />);
    expect(screen.getAllByText("0-15")).toHaveLength(2);
    expect(screen.getByText("10-5")).toBeInTheDocument();
    expect(screen.getByText("11-4")).toBeInTheDocument();
    expect(screen.getByText("1-14")).toBeInTheDocument();
  });

  test("applies correct CSS classes based on performance", () => {
    render(<SimplifiedBanzuke />);
    const rikishiItems = screen.getAllByRole("listitem");

    expect(rikishiItems[0]).toHaveClass("make-koshi");
    expect(rikishiItems[1]).toHaveClass("kachi-koshi");
    expect(rikishiItems[2]).toHaveClass("kachi-koshi");
    expect(rikishiItems[3]).toHaveClass("make-koshi");
    expect(rikishiItems[4]).toHaveClass("make-koshi");
  });
});
