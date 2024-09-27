import { Eraser, Pencil, Type, Undo } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const Whiteboard = () => {
  const [notes, setNotes] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [sketchMode, setSketchMode] = useState(false);
  const [color, setColor] = useState("black");
  const [isEraser, setIsEraser] = useState(false);
  const [lineWidth] = useState(2);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [undoStack, setUndoStack] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctxRef.current = ctx;
    updateCanvasContext();
  }, []);

  const updateCanvasContext = () => {
    const ctx = ctxRef.current;
    ctx.strokeStyle = isEraser ? "white" : color;
    ctx.lineWidth = isEraser ? 20 : lineWidth;
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const toggleMode = () => {
    setSketchMode(!sketchMode);
  };

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    setUndoStack([...undoStack, canvas.toDataURL()]);
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY,
    );
    setIsDrawing(true);
    saveCanvasState();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    ctxRef.current.lineTo(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY,
    );
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    ctxRef.current.closePath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setUndoStack([]);
  };

  const changeColor = (newColor) => {
    setColor(newColor);
    setIsEraser(false);
  };

  const toggleEraser = () => {
    setIsEraser(!isEraser);
  };

  const undo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 2];
      const img = new Image();
      img.src = previousState;
      img.onload = () => {
        ctxRef.current.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height,
        );
        ctxRef.current.drawImage(img, 0, 0);
      };
      setUndoStack(undoStack.slice(0, -1));
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Notepad & Sketchpad</h2>
            <div className="flex items-center space-x-2">
              {sketchMode ? (
                <button
                  className="px-4 py-2 rounded-full flex items-center bg-gray-200 text-gray-700"
                  onClick={toggleMode}
                  type="submit"
                >
                  <Type className="mr-2" />
                  Text Mode
                </button>
              ) : (
                <button
                  className="px-4 py-2 rounded-full flex items-center bg-blue-500 text-white"
                  onClick={toggleMode}
                  type="submit"
                >
                  <Pencil className="mr-2" />
                  Sketch Mode
                </button>
              )}
              {sketchMode && (
                <>
                  <button
                    className={`w-8 h-8 rounded-full ${color === "black" && !isEraser ? "ring-2 ring-gray-400" : ""}`}
                    style={{ backgroundColor: "black" }}
                    onClick={() => changeColor("black")}
                    type="submit"
                  />
                  <button
                    className={`w-8 h-8 rounded-full ${color === "red" && !isEraser ? "ring-2 ring-gray-400" : ""}`}
                    style={{ backgroundColor: "red" }}
                    onClick={() => changeColor("red")}
                    type="submit"
                  />
                  <button
                    className={`w-8 h-8 rounded-full ${color === "yellow" && !isEraser ? "ring-2 ring-gray-400" : ""}`}
                    style={{ backgroundColor: "yellow" }}
                    onClick={() => changeColor("yellow")}
                    type="submit"
                  />
                  <button
                    className={`w-8 h-8 rounded-full ${color === "green" && !isEraser ? "ring-2 ring-gray-400" : ""}`}
                    style={{ backgroundColor: "green" }}
                    onClick={() => changeColor("green")}
                    type="submit"
                  />
                  <button
                    className={`p-1 rounded ${isEraser ? "bg-gray-300" : "bg-white"}`}
                    onClick={toggleEraser}
                    type="submit"
                  >
                    <Eraser size={24} />
                  </button>
                  <button
                    className="p-1 rounded bg-white"
                    onClick={undo}
                    disabled={undoStack.length <= 1}
                    type="submit"
                  >
                    <Undo size={24} />
                  </button>
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    onClick={clearCanvas}
                    type="submit"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="relative" style={{ height: "400px" }}>
            <textarea
              className="w-full h-full p-2 border rounded resize-none"
              value={notes}
              onChange={handleNotesChange}
              placeholder="Type your notes here..."
              style={{ display: sketchMode ? "none" : "block" }}
            />
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              className="absolute top-0 left-0 w-full h-full cursor-crosshair border rounded"
              style={{ display: sketchMode ? "block" : "none" }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
