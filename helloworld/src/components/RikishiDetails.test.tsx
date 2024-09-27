import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import RikishiDetails from "./RikishiDetails";

const mockRikishi = {
  id: "1",
  name: "Terunofuji",
  rank: "Y1e",
  wins: 10,
  losses: 5,
  notes: "Yokozuna",
};

describe("RikishiDetails", () => {
  test("renders rikishi information", () => {
    render(<RikishiDetails rikishi={mockRikishi} onUpdate={vi.fn()} />);

    expect(screen.getByText("Terunofuji")).toBeInTheDocument();
  });

  test("enters edit mode when Edit button is clicked", () => {
    render(<RikishiDetails rikishi={mockRikishi} onUpdate={vi.fn()} />);

    fireEvent.click(screen.getByText("Edit"));

    expect(screen.getByLabelText("Name:")).toHaveValue("Terunofuji");
    expect(screen.getByLabelText("Rank:")).toHaveValue("Y1e");
    expect(screen.getByLabelText("Wins:")).toHaveValue(10);
    expect(screen.getByLabelText("Losses:")).toHaveValue(5);
    expect(screen.getByLabelText("Notes:")).toHaveValue("Yokozuna");
  });

  test("updates rikishi information when form is submitted", () => {
    const mockOnUpdate = vi.fn();
    render(<RikishiDetails rikishi={mockRikishi} onUpdate={mockOnUpdate} />);

    fireEvent.click(screen.getByText("Edit"));

    fireEvent.change(screen.getByLabelText("Name:"), {
      target: { value: "Updated Terunofuji" },
    });
    fireEvent.change(screen.getByLabelText("Rank:"), {
      target: { value: "Y1w" },
    });
    fireEvent.change(screen.getByLabelText("Wins:"), {
      target: { value: "11" },
    });
    fireEvent.change(screen.getByLabelText("Losses:"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText("Notes:"), {
      target: { value: "Updated Yokozuna" },
    });

    fireEvent.click(screen.getByText("Save"));

    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockRikishi,
      name: "Updated Terunofuji",
      rank: "Y1w",
      wins: 11,
      losses: 4,
      notes: "Updated Yokozuna",
    });
  });

  test("cancels editing when Cancel button is clicked", () => {
    render(<RikishiDetails rikishi={mockRikishi} onUpdate={vi.fn()} />);

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByLabelText("Name:"), {
      target: { value: "Updated Terunofuji" },
    });
    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.queryByLabelText("Name:")).not.toBeInTheDocument();
    expect(screen.getByText("Terunofuji")).toBeInTheDocument();
  });
});
