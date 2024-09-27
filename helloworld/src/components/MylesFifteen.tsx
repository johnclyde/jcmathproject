import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "../utils/uuid";

const GRID_SIZE = 4;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;

const FifteenPuzzle: React.FC = () => {
  const [tiles, setTiles] = useState(
    Array.from({ length: TILE_COUNT }, (_, i) => i),
  );
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [tileSize, setTileSize] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const checkPuzzleSolved = useCallback(() => {
    const solved = tiles.every((tile, index) => tile === index);
    if (solved) {
      setIsRunning(false);
      setIsPuzzleSolved(true);
    }
  }, [tiles]);

  useEffect(() => {
    if (imageData) {
      checkPuzzleSolved();
    }
  }, [imageData, checkPuzzleSolved]);

  const loadImageIntoMemory = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        canvas.width = canvas.height = size;
        ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size);
        setImageData(imgData);
        setTileSize(size / GRID_SIZE);
        setPreviewUrl(canvas.toDataURL());

        shuffleTiles();
        setTimer(0);
        setIsRunning(false);
        setIsPuzzleSolved(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const shuffleTiles = () => {
    const newTiles = [...tiles];
    for (let i = newTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newTiles[i], newTiles[j]] = [newTiles[j], newTiles[i]];
    }
    setTiles(newTiles);
  };

  const handleTileClick = (index: number) => {
    if (!isRunning) {
      setIsRunning(true);
    }
    const emptyIndex = tiles.indexOf(TILE_COUNT - 1);
    if (isAdjacent(index, emptyIndex)) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [
        newTiles[emptyIndex],
        newTiles[index],
      ];
      setTiles(newTiles);
    }
  };

  const isAdjacent = (index1: number, index2: number) => {
    const row1 = Math.floor(index1 / GRID_SIZE);
    const col1 = index1 % GRID_SIZE;
    const row2 = Math.floor(index2 / GRID_SIZE);
    const col2 = index2 % GRID_SIZE;
    return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadImageIntoMemory(file);
    }
  };

  const renderTile = (tileIndex: number, index: number) => {
    if (!imageData) return null;

    const tileCanvas = document.createElement("canvas");
    tileCanvas.width = tileCanvas.height = tileSize;
    const tileCtx = tileCanvas.getContext("2d");
    if (!tileCtx) return null;

    const srcX = (tileIndex % GRID_SIZE) * tileSize;
    const srcY = Math.floor(tileIndex / GRID_SIZE) * tileSize;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return null;
    tempCtx.putImageData(imageData, 0, 0);

    tileCtx.drawImage(
      tempCanvas,
      srcX,
      srcY,
      tileSize,
      tileSize,
      0,
      0,
      tileSize,
      tileSize,
    );

    // Make the blank tile extremely faint
    if (tileIndex === TILE_COUNT - 1 && !isPuzzleSolved) {
      tileCtx.fillStyle = "rgba(255, 255, 255, 0.95)";
      tileCtx.fillRect(0, 0, tileSize, tileSize);
    }

    return (
      <div
        key={tileIndex}
        className="w-full h-full cursor-pointer"
        onClick={() => handleTileClick(index)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleTileClick(index);
          }
        }}
        tabIndex={0}
        role="button"
        style={{
          backgroundImage: `url(${tileCanvas.toDataURL()})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} className="hidden" />
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100"
        />
      </div>
      {previewUrl && (
        <div className="mb-4">
          <img
            src={previewUrl}
            alt="Uploaded puzzle preview"
            className="w-64 h-64 object-cover"
          />
        </div>
      )}
      <div className="mb-2 text-lg font-semibold">
        Time: {formatTime(timer)}
      </div>
      <div className="grid grid-cols-4 gap-1 w-64 h-64 bg-gray-200 p-1">
        {imageData
          ? tiles.map((tileIndex, index) => renderTile(tileIndex, index))
          : Array.from({ length: TILE_COUNT }).map((_, index) => (
              <div
                key={`empty-tile-${uuidv4()}`}
                className="bg-gray-300 w-full h-full flex items-center justify-center text-gray-600 font-bold"
              >
                {index + 1}
              </div>
            ))}
      </div>
      <button
        onClick={shuffleTiles}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={!imageData || isRunning}
        type="submit"
      >
        Shuffle
      </button>
      {isPuzzleSolved && (
        <div className="mt-4 text-lg font-bold text-green-600">
          Congratulations! Puzzle solved in {formatTime(timer)}!
        </div>
      )}
    </div>
  );
};

export default FifteenPuzzle;
