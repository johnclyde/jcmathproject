import { MinusCircle, PlusCircle } from "lucide-react";
import { useState } from "react";

const InteractiveCounter = () => {
  const [count, setCount] = useState(0);
  const increment = () => setCount((prev) => prev + 1);
  const decrement = () => setCount((prev) => prev - 1);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">Interactive Counter</h1>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={decrement}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            type="submit"
          >
            <MinusCircle size={24} />
          </button>
          <span className="text-4xl font-bold">{count}</span>
          <button
            onClick={increment}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            type="submit"
          >
            <PlusCircle size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCounter;
