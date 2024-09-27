import { useState } from "react";

const BanzukeSurfer = () => {
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedBasho, setSelectedBasho] = useState(null);

  const years = Array.from({ length: 10 }, (_, i) => 2015 + i);
  const bashos = ["January", "March", "May", "July", "September", "November"];

  // Dummy data for the leaderboard
  const dummyLeaderboard = [
    { rank: "Yokozuna", name: "Hakuho", wins: 15, losses: 0 },
    { rank: "Ozeki", name: "Terunofuji", wins: 12, losses: 3 },
    { rank: "Sekiwake", name: "Takakeisho", wins: 11, losses: 4 },
    { rank: "Komusubi", name: "Mitakeumi", wins: 10, losses: 5 },
    { rank: "Maegashira 1", name: "Daieisho", wins: 9, losses: 6 },
  ];

  const renderYearButtons = () => (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Select Year:</h2>
      <div className="flex flex-wrap gap-2">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-2 rounded ${selectedYear === year ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            type="submit"
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );

  const renderBashoButtons = () => (
    <div className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Select Basho:</h2>
      <div className="flex flex-wrap gap-2">
        {bashos.map((basho) => (
          <button
            key={basho}
            onClick={() => setSelectedBasho(basho)}
            className={`px-4 py-2 rounded ${selectedBasho === basho ? "bg-green-500 text-white" : "bg-gray-200"}`}
            type="submit"
          >
            {basho}
          </button>
        ))}
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">
        Leaderboard: {selectedYear} {selectedBasho} Basho
      </h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Rank</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Wins</th>
            <th className="border p-2">Losses</th>
          </tr>
        </thead>
        <tbody>
          {dummyLeaderboard.map((wrestler) => (
            <tr
              key={wrestler.rank}
              className={index % 2 === 0 ? "bg-gray-100" : ""}
            >
              <td className="border p-2">{wrestler.rank}</td>
              <td className="border p-2">{wrestler.name}</td>
              <td className="border p-2">
                {wrestler.wins}-{wrestler.losses}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Banzuke Surfer</h1>
      {renderYearButtons()}
      {selectedYear && renderBashoButtons()}
      {selectedYear && selectedBasho && renderLeaderboard()}
    </div>
  );
};

export default BanzukeSurfer;
