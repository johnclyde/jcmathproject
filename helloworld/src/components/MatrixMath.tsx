import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { v4 as uuidv4 } from "../utils/uuid";

// Utility functions
const gcd = (a: number, b: number): number => {
  let absA = Math.abs(a);
  let absB = Math.abs(b);
  while (absB) {
    [absA, absB] = [absB, absA % absB];
  }
  return absA;
};

const reduceFraction = (numerator: number, denominator: number) => {
  if (denominator === 0) return { numerator: 0, denominator: 1 };
  const divisor = gcd(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
};

const parseFraction = (str: string) => {
  if (str === "-") return { numerator: 0, denominator: 1, display: "-" };
  const parts = str.split("/").map((part) => part.trim());
  if (parts.length === 1) {
    const num = Number.parseFloat(parts[0]);
    return Number.isNaN(num)
      ? { numerator: 0, denominator: 1, display: str }
      : reduceFraction(num, 1);
  }
  if (parts.length === 2) {
    const num = Number.parseFloat(parts[0]);
    const den = Number.parseFloat(parts[1]);
    if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) {
      return reduceFraction(num, den);
    }
  }
  return { numerator: 0, denominator: 1, display: str };
};

const formatFraction = (fraction: {
  numerator: number;
  denominator: number;
  display?: string;
}) => {
  if (fraction.display !== undefined) return fraction.display;
  if (fraction.denominator === 1) return `${fraction.numerator}`;
  return `${fraction.numerator}/${fraction.denominator}`;
};

interface Fraction {
  numerator: number;
  denominator: number;
  display?: string;
}

// Matrix Input Component
const MatrixInput: React.FC<{
  matrix: Fraction[][];
  setMatrix: React.Dispatch<React.SetStateAction<Fraction[][]>>;
  rows: number;
  cols: number;
  label: string;
  scale?: number;
}> = ({ matrix, setMatrix, rows, cols, label, scale = 1 }) => {
  const handleChange = useCallback(
    (row: number, col: number, value: string) => {
      setMatrix((prev) => {
        const newMatrix = [...prev];
        newMatrix[row] = [...newMatrix[row]];
        newMatrix[row][col] = parseFraction(value);
        return newMatrix;
      });
    },
    [setMatrix],
  );

  const handleBlur = useCallback(
    (row: number, col: number) => {
      setMatrix((prev) => {
        const newMatrix = [...prev];
        newMatrix[row] = [...newMatrix[row]];
        newMatrix[row][col] = parseFraction(
          formatFraction(newMatrix[row][col]),
        );
        return newMatrix;
      });
    },
    [setMatrix],
  );

  return (
    <div
      className="mb-6"
      style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
    >
      <h3 className="text-lg font-semibold mb-2">{label}</h3>
      <div>
        {matrix.map((row, rowIndex) => (
          <div key={`row-${label}-${uuidv4()}`} className="flex justify-center">
            {row.map((cell, colIndex) => (
              <input
                key={`cell-${label}-${uuidv4()}`}
                value={formatFraction(cell)}
                onChange={(e) =>
                  handleChange(rowIndex, colIndex, e.target.value)
                }
                onBlur={() => handleBlur(rowIndex, colIndex)}
                className="w-14 p-1 m-1 text-center border border-gray-300 rounded"
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 text-sm text-gray-600">
        {rows} × {cols}
      </div>
    </div>
  );
};

// Matrix Display Component
const MatrixDisplay: React.FC<{ matrix: Fraction[][]; label: string }> = ({
  matrix,
  label,
}) => (
  <div className="my-4">
    {matrix.map((row, rowIndex) => (
      <div key={`row-${label}-${uuidv4()}`} className="flex justify-center">
        {row.map((cell, colIndex) => (
          <span
            key={`cell-${label}-${uuidv4()}`}
            className="w-14 p-1 m-1 text-center border border-gray-300 rounded inline-block"
          >
            {formatFraction(cell)}
          </span>
        ))}
      </div>
    ))}
  </div>
);

// Matrix Operations
const multiplyFractions = (a: Fraction, b: Fraction) =>
  reduceFraction(a.numerator * b.numerator, a.denominator * b.denominator);

const addFractions = (a: Fraction, b: Fraction) => {
  const numerator = a.numerator * b.denominator + b.numerator * a.denominator;
  const denominator = a.denominator * b.denominator;
  return reduceFraction(numerator, denominator);
};

const multiplyMatrices = (a: Fraction[][], b: Fraction[][]) => {
  const result: Fraction[][] = Array(a.length)
    .fill(0)
    .map(() => Array(b[0].length).fill({ numerator: 0, denominator: 1 }));
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b[0].length; j++) {
      result[i][j] = a[i].reduce(
        (sum, _, k) => addFractions(sum, multiplyFractions(a[i][k], b[k][j])),
        { numerator: 0, denominator: 1 },
      );
    }
  }
  return result;
};

const addMatrices = (a: Fraction[][], b: Fraction[][]) => {
  return a.map((row, i) => row.map((cell, j) => addFractions(cell, b[i][j])));
};

// Operation Result Component
const OperationResult: React.FC<{
  matrixA: Fraction[][];
  matrixB: Fraction[][];
  result: Fraction[][];
  operation: string;
}> = ({ matrixA, matrixB, result, operation }) => (
  <div className="mt-8 text-center">
    <h3 className="text-xl font-semibold mb-4">Result</h3>
    <MatrixDisplay matrix={result} label="result" />
    <div className="text-2xl my-4">=</div>
    <MatrixDisplay matrix={matrixA} label="matrixA" />
    <div className="text-2xl my-4">{operation === "multiply" ? "×" : "+"}</div>
    <MatrixDisplay matrix={matrixB} label="matrixB" />
  </div>
);

// Main Component
const InteractiveMatrixOperations: React.FC = () => {
  const [matrixA, setMatrixA] = useState<Fraction[][]>([
    [
      { numerator: 1, denominator: 1 },
      { numerator: 2, denominator: 1 },
    ],
    [
      { numerator: 3, denominator: 1 },
      { numerator: 4, denominator: 1 },
    ],
  ]);
  const [matrixB, setMatrixB] = useState<Fraction[][]>([
    [
      { numerator: 5, denominator: 1 },
      { numerator: 6, denominator: 1 },
    ],
    [
      { numerator: 7, denominator: 1 },
      { numerator: 8, denominator: 1 },
    ],
  ]);
  const [operationState, setOperationState] = useState<{
    matrixA: Fraction[][];
    matrixB: Fraction[][];
    result: Fraction[][];
    operation: string;
  } | null>(null);
  const [canMultiply, setCanMultiply] = useState(true);
  const [canAdd, setCanAdd] = useState(true);
  const [scale, setScale] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanMultiply(matrixA[0].length === matrixB.length);
    setCanAdd(
      matrixA.length === matrixB.length &&
        matrixA[0].length === matrixB[0].length,
    );
  }, [matrixA, matrixB]);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const resultWidth = containerRef.current.scrollWidth;
        if (resultWidth > containerWidth) {
          setScale(Math.max(0.5, containerWidth / resultWidth));
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handleResize = (
    matrix: Fraction[][],
    dimension: "rows" | "cols",
    delta: number,
  ) => {
    const newMatrix = [...matrix];
    if (dimension === "rows") {
      if (delta > 0) {
        newMatrix.push(
          Array(matrix[0].length).fill({ numerator: 0, denominator: 1 }),
        );
      } else if (newMatrix.length > 1) {
        newMatrix.pop();
      }
    } else {
      if (delta > 0) {
        for (const row of newMatrix) {
          row.push({ numerator: 0, denominator: 1 });
        }
      } else if (newMatrix[0].length > 1) {
        for (const row of newMatrix) {
          row.pop();
        }
      }
    }
    return newMatrix;
  };

  const handleMultiply = () => {
    if (canMultiply) {
      const newResult = multiplyMatrices(matrixA, matrixB);
      setOperationState({
        matrixA: JSON.parse(JSON.stringify(matrixA)),
        matrixB: JSON.parse(JSON.stringify(matrixB)),
        result: newResult,
        operation: "multiply",
      });
    }
  };

  const handleAdd = () => {
    if (canAdd) {
      const newResult = addMatrices(matrixA, matrixB);
      setOperationState({
        matrixA: JSON.parse(JSON.stringify(matrixA)),
        matrixB: JSON.parse(JSON.stringify(matrixB)),
        result: newResult,
        operation: "add",
      });
    }
  };

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-6">
        Interactive Matrix Operations
      </h2>
      <div className="flex justify-around flex-wrap">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          <MatrixInput
            matrix={matrixA}
            setMatrix={setMatrixA}
            rows={matrixA.length}
            cols={matrixA[0].length}
            label="Matrix A"
          />
          <div className="flex justify-center flex-wrap">
            <button
              onClick={() =>
                setMatrixA((prev) => handleResize(prev, "rows", 1))
              }
              className="bg-blue-500 text-white px-4 py-2 rounded m-1 hover:bg-blue-600"
              type="submit"
            >
              Add Row
            </button>
            <button
              onClick={() =>
                setMatrixA((prev) => handleResize(prev, "rows", -1))
              }
              className="bg-blue-500 text-white px-4 py-2 rounded m-1 hover:bg-blue-600"
              type="submit"
            >
              Remove Row
            </button>
            <button
              onClick={() =>
                setMatrixA((prev) => handleResize(prev, "cols", 1))
              }
              className="bg-blue-500 text-white px-4 py-2 rounded m-1 hover:bg-blue-600"
              type="submit"
            >
              Add Column
            </button>
            <button
              onClick={() =>
                setMatrixA((prev) => handleResize(prev, "cols", -1))
              }
              className="bg-blue-500 text-white px-4 py-2 rounded m-1 hover:bg-blue-600"
              type="submit"
            >
              Remove Column
            </button>
          </div>
        </div>
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          <MatrixInput
            matrix={matrixB}
            setMatrix={setMatrixB}
            rows={matrixB.length}
            cols={matrixB[0].length}
            label="Matrix B"
          />
          <div className="flex justify-center flex-wrap">
            <button
              onClick={() =>
                setMatrixB((prev) => handleResize(prev, "rows", 1))
              }
              className="bg-blue-500 text-white px-4 py-2 rounded m-1 hover:bg-blue-600"
              type="submit"
            >
              Add Row
            </button>
            <button
              onClick={() =>
                setMatrixB((prev) => handleResize(prev, "rows", -1))
              }
              className="bg-blue-500 text-white px-4 py-2 rounded m-1 hover:bg-blue-600"
              type="submit"
            >
              Remove Row
            </button>
            <button
              onClick={() =>
                setMatrixB((prev) => handleResize(prev, "cols", 1))
              }
              className="bg-blue-500 text-white px-4 py-2 rounded m-1 hover:bg-blue-600"
              type="submit"
            >
              Add Column
            </button>
            <button
              onClick={() =>
                setMatrixB((prev) => handleResize(prev, "cols", -1))
              }
              className="bg-blue-500 text-white px-4 py-2 rounded m-1 hover:bg-blue-600"
              type="submit"
            >
              Remove Column
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-center my-6">
        <button
          onClick={handleMultiply}
          disabled={!canMultiply}
          className={`px-6 py-2 rounded m-2 ${canMultiply ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
          type="submit"
        >
          Multiply
        </button>
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className={`px-6 py-2 rounded m-2 ${canAdd ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
          type="submit"
        >
          Add
        </button>
      </div>
      {operationState && (
        <OperationResult
          matrixA={operationState.matrixA}
          matrixB={operationState.matrixB}
          result={operationState.result}
          operation={operationState.operation}
        />
      )}
    </div>
  );
};

export default InteractiveMatrixOperations;
