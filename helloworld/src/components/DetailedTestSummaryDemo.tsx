import type React from "react";
import { useState } from "react";
import DetailedTestSummary, { type Event } from "./DetailedTestSummary";

const sampleEvents: Event[] = [
  {
    type: "createChallengeRun",
    timestamp: "2024-09-03T20:26:13.199Z",
    problemLabel: "N/A",
    data: "N/A",
  },
  {
    type: "navigateAway",
    timestamp: "2024-09-03T20:26:29.900Z",
    problemLabel: "1",
    data: "N/A",
  },
  {
    type: "openProblem",
    timestamp: "2024-09-03T20:26:29.901Z",
    problemLabel: "2",
    data: "N/A",
  },
  {
    type: "navigateAway",
    timestamp: "2024-09-03T20:26:44.316Z",
    problemLabel: "2",
    data: "N/A",
  },
  {
    type: "openProblem",
    timestamp: "2024-09-03T20:26:44.317Z",
    problemLabel: "3",
    data: "N/A",
  },
  {
    type: "submitAnswer",
    timestamp: "2024-09-03T20:27:42.380Z",
    problemLabel: "3",
    data: '{"answer":"E","timeSpent":0}',
  },
  {
    type: "openProblem",
    timestamp: "2024-09-03T20:27:42.381Z",
    problemLabel: "4",
    data: "N/A",
  },
  {
    type: "submitAnswer",
    timestamp: "2024-09-03T20:28:36.256Z",
    problemLabel: "4",
    data: '{"answer":"E","timeSpent":0}',
  },
  {
    type: "navigateAway",
    timestamp: "2024-09-03T20:28:36.257Z",
    problemLabel: "4",
    data: "N/A",
  },
  {
    type: "submitAnswer",
    timestamp: "2024-09-03T20:29:11.375Z",
    problemLabel: "5",
    data: '{"answer":"D","timeSpent":0}',
  },
];

const DetailedTestSummaryDemo: React.FC = () => {
  const [events, setEvents] = useState<Event[]>(sampleEvents);

  const addRandomEvent = () => {
    const newEvent: Event = {
      type: ["openProblem", "submitAnswer", "navigateAway"][
        Math.floor(Math.random() * 3)
      ],
      timestamp: new Date().toISOString(),
      problemLabel: String(Math.floor(Math.random() * 5) + 1),
      data: `{"answer":"${["A", "B", "C", "D", "E"][Math.floor(Math.random() * 5)]}","timeSpent":0}`,
    };
    setEvents([...events, newEvent]);
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Detailed Test Summary Demo</h1>
      <button
        onClick={addRandomEvent}
        className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        type="submit"
      >
        Add Random Event
      </button>
      <DetailedTestSummary events={events} />
    </div>
  );
};

export default DetailedTestSummaryDemo;
