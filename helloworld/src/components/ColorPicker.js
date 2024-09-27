import { useState } from "react";

const ColorPicker = () => {
  const [color, setColor] = useState("#3498db");

  const handleColorChange = (e) => {
    setColor(e.target.value);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">Interactive Color Picker</h1>
      <div className="bg-white p-8 rounded-lg shadow-md w-80">
        <div
          className="w-full h-40 mb-4 rounded-md transition-colors duration-300"
          style={{ backgroundColor: color }}
        />
        <div className="flex items-center justify-between">
          <input
            type="color"
            value={color}
            onChange={handleColorChange}
            className="w-12 h-12 cursor-pointer"
          />
          <span className="text-xl font-semibold">{color}</span>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
