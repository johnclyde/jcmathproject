import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "../utils/uuid";

const AlertDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">{children}</div>
    </div>
  );
};

const AlertDialogContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div>{children}</div>;

const AlertDialogHeader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="mb-4">{children}</div>;

const AlertDialogTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <h3 className="text-lg font-semibold">{children}</h3>;

const AlertDialogDescription: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <p className="text-sm text-gray-500">{children}</p>;

const AlertDialogFooter: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="flex justify-end">{children}</div>;

const AlertDialogAction: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    type="submit"
  >
    {children}
  </button>
);

const COLORS = ["red", "blue", "green", "yellow"];
const TUBE_CAPACITY = 4;
const TOTAL_TUBES = 6;

const BallSortingPuzzle: React.FC = () => {
  const [tubes, setTubes] = useState<string[][]>([]);
  const [selectedTube, setSelectedTube] = useState<number | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const balls = COLORS.flatMap((color) => Array(TUBE_CAPACITY).fill(color));
    const shuffledBalls = balls.sort(() => Math.random() - 0.5);

    const initialTubes = [];
    for (let i = 0; i < TOTAL_TUBES; i++) {
      if (i < TOTAL_TUBES - 2) {
        initialTubes.push(
          shuffledBalls.slice(i * TUBE_CAPACITY, (i + 1) * TUBE_CAPACITY),
        );
      } else {
        initialTubes.push([]);
      }
    }
    setTubes(initialTubes);
    setSelectedTube(null);
  };

  const handleTubeClick = (tubeIndex: number) => {
    if (selectedTube === null) {
      if (tubes[tubeIndex].length > 0) {
        setSelectedTube(tubeIndex);
      }
    } else {
      if (canMoveBall(selectedTube, tubeIndex)) {
        moveBall(selectedTube, tubeIndex);
        setSelectedTube(null);
      } else {
        setAlertMessage(
          "Invalid move! The destination tube is full or the colors don't match.",
        );
        setIsAlertOpen(true);
      }
    }
  };

  const canMoveBall = (fromIndex: number, toIndex: number) => {
    const fromTube = tubes[fromIndex];
    const toTube = tubes[toIndex];
    return (
      toTube.length < TUBE_CAPACITY &&
      (toTube.length === 0 ||
        toTube[toTube.length - 1] === fromTube[fromTube.length - 1])
    );
  };

  const moveBall = (fromIndex: number, toIndex: number) => {
    setTubes((prevTubes) => {
      const newTubes = [...prevTubes];
      const ball = newTubes[fromIndex].pop();
      if (ball !== undefined) {
        newTubes[toIndex].push(ball);
      }
      return newTubes;
    });
  };

  const checkWin = useCallback(() => {
    return tubes.every(
      (tube) =>
        tube.length === 0 ||
        (tube.length === TUBE_CAPACITY &&
          tube.every((ball) => ball === tube[0])),
    );
  }, [tubes]);

  useEffect(() => {
    if (checkWin()) {
      setAlertMessage("Congratulations! You've solved the puzzle!");
      setIsAlertOpen(true);
    }
  }, [checkWin]);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Ball Sorting Puzzle</h1>
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        {tubes.map((tube, tubeIndex) => (
          <div
            key={`tube-${uuidv4()}`}
            className={`w-16 h-64 border-2 border-gray-300 flex flex-col-reverse items-center p-2 cursor-pointer ${
              selectedTube === tubeIndex ? "border-black border-4" : ""
            }`}
            onClick={() => handleTubeClick(tubeIndex)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleTubeClick(tubeIndex);
              }
            }}
            tabIndex={0}
            role="button"
          >
            {tube.map((color, ballIndex) => (
              <div
                key={`ball-${uuidv4()}`}
                className={"w-12 h-12 rounded-full mb-1"}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        ))}
      </div>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        onClick={initializeGame}
        type="submit"
      >
        New Puzzle
      </button>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Game Alert</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsAlertOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BallSortingPuzzle;
