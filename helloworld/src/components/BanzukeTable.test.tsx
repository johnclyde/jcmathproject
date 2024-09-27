import { render, screen, within } from "@testing-library/react";
import BanzukeTable from "./BanzukeTable";

const mockRikishi = [
  { id: "1", name: "Terunofuji", rank: "Y1e", wins: 0, losses: 15 },
  { id: "2", name: "Hoshoryu", rank: "O1e", wins: 10, losses: 5 },
  { id: "3", name: "Kotozakura", rank: "O1w", wins: 11, losses: 4 },
  { id: "4", name: "Takakeisho", rank: "O2e", wins: 0, losses: 15 },
  { id: "5", name: "Kirishima", rank: "O2w", wins: 1, losses: 14 },
];

describe("BanzukeTable", () => {
  test("renders the component title", () => {
    render(<BanzukeTable initialRikishi={mockRikishi} />);
    expect(screen.getByText("Banzuke Table")).toBeInTheDocument();
  });

  test("renders table headers correctly", () => {
    render(<BanzukeTable initialRikishi={mockRikishi} />);
    expect(screen.getByText("Rank")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Record")).toBeInTheDocument();
  });

  test("renders all initial rikishi", () => {
    render(<BanzukeTable initialRikishi={mockRikishi} />);
    for (const rikishi of mockRikishi) {
      expect(screen.getByText(rikishi.name)).toBeInTheDocument();
    }
  });

  test("displays correct ranks for rikishi", () => {
    render(<BanzukeTable initialRikishi={mockRikishi} />);
    for (const rikishi of mockRikishi) {
      expect(screen.getByText(rikishi.rank)).toBeInTheDocument();
    }
  });

  test("displays correct win-loss records", () => {
    render(<BanzukeTable initialRikishi={mockRikishi} />);
    const rows = screen.getAllByRole("row").slice(1); // Exclude header row

    mockRikishi.forEach((rikishi, index) => {
      const cells = within(rows[index]).getAllByRole("cell");
      expect(cells[2]).toHaveTextContent(`${rikishi.wins}-${rikishi.losses}`);
    });
  });

  test("applies correct CSS classes based on performance", () => {
    render(<BanzukeTable initialRikishi={mockRikishi} />);
    const rows = screen.getAllByRole("row").slice(1); // Exclude header row

    expect(rows[0]).toHaveClass("make-koshi");
    expect(rows[1]).toHaveClass("kachi-koshi");
    expect(rows[2]).toHaveClass("kachi-koshi");
    expect(rows[3]).toHaveClass("make-koshi");
    expect(rows[4]).toHaveClass("make-koshi");
  });

  test("renders correct number of table rows", () => {
    render(<BanzukeTable initialRikishi={mockRikishi} />);
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(mockRikishi.length + 1); // +1 for header row
  });

  test("renders rikishi information in correct order", () => {
    render(<BanzukeTable initialRikishi={mockRikishi} />);
    const rows = screen.getAllByRole("row").slice(1); // Exclude header row

    rows.forEach((row, index) => {
      const cells = within(row).getAllByRole("cell");
      expect(cells[0]).toHaveTextContent(mockRikishi[index].rank);
      expect(cells[1]).toHaveTextContent(mockRikishi[index].name);
      expect(cells[2]).toHaveTextContent(
        `${mockRikishi[index].wins}-${mockRikishi[index].losses}`,
      );
    });
  });
});
