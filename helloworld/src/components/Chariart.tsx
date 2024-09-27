import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const initialData = [
  { name: "A", value: 400, color: "#8884d8" },
  { name: "B", value: 300, color: "#82ca9d" },
  { name: "C", value: 200, color: "#ffc658" },
  { name: "D", value: 278, color: "#ff8042" },
  { name: "E", value: 189, color: "#0088FE" },
];

export default function InteractiveMultiChart() {
  const [data, setData] = useState(initialData);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newColor, setNewColor] = useState("#000000");
  const [chartType, setChartType] = useState("bar");

  const handleAdd = () => {
    if (newName && newValue) {
      setData([
        ...data,
        { name: newName, value: Number.parseInt(newValue), color: newColor },
      ]);
      setNewName("");
      setNewValue("");
      setNewColor("#000000");
    }
  };

  const handleRemove = (name) => {
    setData(data.filter((item) => item.name !== name));
  };

  const handleColorChange = (name, color) => {
    setData(
      data.map((item) => (item.name === name ? { ...item, color } : item)),
    );
  };

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value">
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case "table":
        return (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Value</th>
                <th className="px-4 py-2 border">Color</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.name}>
                  <td className="px-4 py-2 border">{item.name}</td>
                  <td className="px-4 py-2 border">{item.value}</td>
                  <td
                    className="px-4 py-2 border"
                    style={{ backgroundColor: item.color }}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Interactive Multi-Chart</h2>
      <div className="mb-4 flex flex-wrap items-center">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter name"
          className="border p-2 mr-2 mb-2"
        />
        <input
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Enter value"
          className="border p-2 mr-2 mb-2"
        />
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="mr-2 mb-2"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-2"
          type="submit"
        >
          Add
        </button>
      </div>
      <div className="mb-4">
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className="border p-2"
        >
          <option value="bar">Bar Chart</option>
          <option value="pie">Pie Chart</option>
          <option value="table">Table</option>
        </select>
      </div>
      <div className="h-64 w-full mb-4">{renderChart()}</div>
      <div className="mt-4">
        <h3 className="text-xl font-bold mb-2">Data:</h3>
        <ul>
          {data.map((item) => (
            <li key={item.name} className="mb-2 flex items-center">
              <span className="mr-2">
                {item.name}: {item.value}
              </span>
              <input
                type="color"
                value={item.color}
                onChange={(e) => handleColorChange(item.name, e.target.value)}
                className="mr-2"
              />
              <button
                onClick={() => handleRemove(item.name)}
                className="bg-red-500 text-white px-2 py-1 rounded"
                type="submit"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
