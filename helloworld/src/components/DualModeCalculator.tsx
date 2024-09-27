import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DualModeCalculator: React.FC<{
  initialMode?: "scientific" | "graphing";
}> = ({ initialMode = "scientific" }) => {
  const [isGraphingMode, setIsGraphingMode] = useState(
    initialMode === "graphing",
  );
  const [functions, setFunctions] = useState([
    { id: 1, expression: "x^2", color: "#8884d8" },
    { id: 2, expression: "2x + 1", color: "#82ca9d" },
  ]);
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [yMin, setYMin] = useState(-10);
  const [yMax, setYMax] = useState(10);
  const [data, setData] = useState<Array<{ x: number; [key: string]: number }>>(
    [],
  );
  const [display, setDisplay] = useState("0");
  const [isRadians, setIsRadians] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  const evaluateFunction = useCallback((func: string, x: number): number => {
    const tokens = func.match(/(\d+\.?\d*|\+|-|\*|\/|\^|\(|\)|x)/g) || [];
    const output: string[] = [];
    const operators: string[] = [];
    const precedence: { [key: string]: number } = {
      "+": 1,
      "-": 1,
      "*": 2,
      "/": 2,
      "^": 3,
    };

    for (const token of tokens) {
      if (token === "x") {
        output.push(x.toString());
      } else if (token === "(") {
        operators.push(token);
      } else if (token === ")") {
        while (operators.length && operators[operators.length - 1] !== "(") {
          const operator = operators.pop();
          if (operator) output.push(operator);
        }
        operators.pop(); // Remove the '('
      } else if (token in precedence) {
        while (
          operators.length &&
          operators[operators.length - 1] !== "(" &&
          precedence[operators[operators.length - 1]] >= precedence[token]
        ) {
          const operator = operators.pop();
          if (operator) output.push(operator);
        }
        operators.push(token);
      } else {
        output.push(token);
      }
    }

    while (operators.length) {
      const operator = operators.pop();
      if (operator) output.push(operator);
    }

    const stack: number[] = [];
    for (const token of output) {
      if (token in precedence) {
        const b = stack.pop();
        const a = stack.pop();
        if (typeof a === "number" && typeof b === "number") {
          switch (token) {
            case "+":
              stack.push(a + b);
              break;
            case "-":
              stack.push(a - b);
              break;
            case "*":
              stack.push(a * b);
              break;
            case "/":
              stack.push(a / b);
              break;
            case "^":
              stack.push(a ** b);
              break;
          }
        } else {
          throw new Error("Invalid stack state");
        }
      } else {
        stack.push(Number.parseFloat(token));
      }
    }

    return stack.length > 0 ? stack[0] : 0;
  }, []);

  useEffect(() => {
    if (isGraphingMode) {
      const generateData = () => {
        const newData = [];
        const step = (xMax - xMin) / 100;
        for (let x = xMin; x <= xMax; x += step) {
          const point: { x: number; [key: string]: number } = { x };
          for (const func of functions) {
            point[`y${func.id}`] = evaluateFunction(func.expression, x);
          }
          newData.push(point);
        }
        setData(newData);
      };
      generateData();
    }
  }, [functions, xMin, xMax, isGraphingMode, evaluateFunction]);

  const handleZoom = (factor: number, centerX: number, centerY: number) => {
    const newXMin = centerX - (centerX - xMin) * factor;
    const newXMax = centerX + (xMax - centerX) * factor;
    const newYMin = centerY - (centerY - yMin) * factor;
    const newYMax = centerY + (yMax - centerY) * factor;

    setXMin(newXMin);
    setXMax(newXMax);
    setYMin(newYMin);
    setYMax(newYMax);
  };

  const handlePan = (dx: number, dy: number) => {
    const rangeX = xMax - xMin;
    const rangeY = yMax - yMin;

    setXMin((prev) => prev - dx * rangeX);
    setXMax((prev) => prev - dx * rangeX);
    setYMin((prev) => prev + dy * rangeY);
    setYMax((prev) => prev + dy * rangeY);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !chartRef.current) return;

    const dx =
      (event.clientX - lastMousePosition.x) / chartRef.current.clientWidth;
    const dy =
      (event.clientY - lastMousePosition.y) / chartRef.current.clientHeight;

    handlePan(dx, dy);

    setLastMousePosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const centerX =
      xMin + ((event.clientX - rect.left) / rect.width) * (xMax - xMin);
    const centerY =
      yMax - ((event.clientY - rect.top) / rect.height) * (yMax - yMin);

    const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
    handleZoom(zoomFactor, centerX, centerY);
  };

  const addFunction = () => {
    const newId = Math.max(...functions.map((f) => f.id), 0) + 1;
    setFunctions([
      ...functions,
      {
        id: newId,
        expression: "",
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      },
    ]);
  };

  const removeFunction = (id: number) => {
    setFunctions(functions.filter((f) => f.id !== id));
  };

  const updateFunction = (id: number, newExpression: string) => {
    setFunctions(
      functions.map((f) =>
        f.id === id ? { ...f, expression: newExpression } : f,
      ),
    );
  };

  const handleNumber = (num: string) => {
    setDisplay((prev) => (prev === "0" ? num : prev + num));
  };

  const handleOperator = (op: string) => {
    setDisplay((prev) => `${prev} ${op} `);
  };

  const handleFunction = (func: string) => {
    setDisplay((prev) => {
      const value = Number.parseFloat(prev);
      if (Number.isNaN(value)) return "Error";
      switch (func) {
        case "sin":
          return Math.sin(
            isRadians ? value : (value * Math.PI) / 180,
          ).toString();
        case "cos":
          return Math.cos(
            isRadians ? value : (value * Math.PI) / 180,
          ).toString();
        case "tan":
          return Math.tan(
            isRadians ? value : (value * Math.PI) / 180,
          ).toString();
        case "ln":
          return Math.log(value).toString();
        case "log":
          return Math.log10(value).toString();
        case "sqrt":
          return Math.sqrt(value).toString();
        default:
          return prev;
      }
    });
  };

  const handleEquals = () => {
    try {
      const result = evaluateFunction(
        display
          .replace(/π/g, Math.PI.toString())
          .replace(/e/g, Math.E.toString()),
        0,
      );
      setDisplay(result.toString());
    } catch (error) {
      setDisplay("Error");
    }
  };

  const handleClear = () => {
    setDisplay("0");
  };

  const handleBackspace = () => {
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
  };

  const toggleAngleMode = () => {
    setIsRadians((prev) => !prev);
  };

  const renderCalculatorButton = (
    label: string,
    onClick: () => void,
    className = "",
  ) => (
    <button
      onClick={onClick}
      className={`p-2 text-sm font-medium bg-gray-200 hover:bg-gray-300 rounded ${className}`}
      type="submit"
    >
      {label}
    </button>
  );

  const formatTickValue = (value: number | string): string => {
    const numValue = typeof value === "string" ? Number(value) : value;
    if (Number.isNaN(numValue)) {
      return String(value);
    }
    if (Math.abs(numValue) < 0.001 || Math.abs(numValue) > 9999) {
      return numValue.toExponential(2);
    }
    return numValue.toFixed(3);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 bg-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">
          {isGraphingMode ? "Graphing Calculator" : "Scientific Calculator"}
        </h2>
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-600">Scientific</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isGraphingMode}
              onChange={() => setIsGraphingMode((prev) => !prev)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
          </label>
          <span className="ml-2 text-sm text-gray-600">Graphing</span>
        </div>
      </div>
      {isGraphingMode ? (
        <div className="p-4">
          <div className="mb-4 space-y-2">
            {functions.map((func) => (
              <div key={func.id} className="flex items-center space-x-2">
                <input
                  value={func.expression}
                  onChange={(e) => updateFunction(func.id, e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1"
                  placeholder={`Function ${func.id}: e.g., x^2`}
                  style={{ borderColor: func.color }}
                />
                <button
                  onClick={() => removeFunction(func.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  type="submit"
                >
                  X
                </button>
              </div>
            ))}
            <button
              onClick={addFunction}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              type="submit"
            >
              Add Function
            </button>
          </div>

          <div
            className="h-64 mb-4"
            ref={chartRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={[xMin, xMax]}
                  tickCount={5}
                  tickFormatter={formatTickValue}
                  label={{
                    value: "X",
                    position: "insideBottomRight",
                    offset: -5,
                  }}
                />
                <YAxis
                  domain={[yMin, yMax]}
                  tickCount={5}
                  tickFormatter={formatTickValue}
                  label={{ value: "Y", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  formatter={(value: number) => formatTickValue(value)}
                  labelFormatter={(label: string) => formatTickValue(label)}
                />
                <Legend />
                {functions.map((func) => (
                  <Line
                    key={func.id}
                    type="monotone"
                    dataKey={`y${func.id}`}
                    stroke={func.color}
                    name={func.expression}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="text-sm text-gray-600 mb-2">
            Mouse controls: Click and drag to pan, scroll to zoom
          </div>

          <button
            onClick={() => {
              setXMin(-10);
              setXMax(10);
              setYMin(-10);
              setYMax(10);
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            type="submit"
          >
            Reset View
          </button>
        </div>
      ) : (
        <div className="p-4">
          <div className="mb-4 p-3 bg-gray-100 rounded-md text-right">
            <div className="text-xs text-gray-500">
              {isRadians ? "RAD" : "DEG"}
            </div>
            <div className="text-2xl font-semibold text-gray-800 overflow-x-auto">
              {display}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {renderCalculatorButton(isRadians ? "RAD" : "DEG", toggleAngleMode)}
            {renderCalculatorButton("C", handleClear)}
            {renderCalculatorButton("←", handleBackspace)}
            {renderCalculatorButton("÷", () => handleOperator("/"))}

            {renderCalculatorButton("7", () => handleNumber("7"))}
            {renderCalculatorButton("8", () => handleNumber("8"))}
            {renderCalculatorButton("9", () => handleNumber("9"))}
            {renderCalculatorButton("×", () => handleOperator("*"))}

            {renderCalculatorButton("4", () => handleNumber("4"))}
            {renderCalculatorButton("5", () => handleNumber("5"))}
            {renderCalculatorButton("6", () => handleNumber("6"))}
            {renderCalculatorButton("-", () => handleOperator("-"))}

            {renderCalculatorButton("1", () => handleNumber("1"))}
            {renderCalculatorButton("2", () => handleNumber("2"))}
            {renderCalculatorButton("3", () => handleNumber("3"))}
            {renderCalculatorButton("+", () => handleOperator("+"))}

            {renderCalculatorButton("0", () => handleNumber("0"), "col-span-2")}
            {renderCalculatorButton(".", () => handleNumber("."))}
            {renderCalculatorButton("=", handleEquals)}

            {renderCalculatorButton("(", () => handleOperator("("))}
            {renderCalculatorButton(")", () => handleOperator(")"))}
            {renderCalculatorButton("^", () => handleOperator("^"))}
            {renderCalculatorButton("√", () => handleFunction("sqrt"))}

            {renderCalculatorButton("sin", () => handleFunction("sin"))}
            {renderCalculatorButton("cos", () => handleFunction("cos"))}
            {renderCalculatorButton("tan", () => handleFunction("tan"))}
            {renderCalculatorButton("sin", () => handleFunction("sin"))}
            {renderCalculatorButton("cos", () => handleFunction("cos"))}
            {renderCalculatorButton("tan", () => handleFunction("tan"))}
            {renderCalculatorButton("ln", () => handleFunction("ln"))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DualModeCalculator;
