import { format, parseISO } from "date-fns";
import type React from "react";

export interface Event {
  type: string;
  timestamp: string;
  problemLabel: string;
  data: string;
}

interface DetailedTestSummaryProps {
  events: Event[];
  title?: string;
}

const DetailedTestSummary: React.FC<DetailedTestSummaryProps> = ({
  events,
  title = "Detailed Test Summary",
}) => {
  const formatTime = (timestamp: string) => {
    return format(parseISO(timestamp), "HH:mm:ss");
  };

  const formatDifferential = (diff: number) => {
    const seconds = Math.floor(diff / 1000);
    const milliseconds = diff % 1000;
    return `+${seconds}.${milliseconds.toString().padStart(3, "0")}s`;
  };

  const groupEventsByProblem = (events: Event[]) => {
    const problems: { [key: string]: Event[] } = {};
    for (const event of events) {
      if (event.problemLabel !== "N/A") {
        if (!problems[event.problemLabel]) {
          problems[event.problemLabel] = [];
        }
        problems[event.problemLabel].push(event);
      }
    }
    return problems;
  };

  const renderEventText = (event: Event) => {
    switch (event.type) {
      case "openProblem":
        return "Opened";
      case "submitAnswer": {
        const answer = JSON.parse(event.data).answer;
        return `Submitted answer: ${answer}`;
      }
      case "navigateAway":
        return "Navigated away";
      default:
        return event.type;
    }
  };

  const problems = groupEventsByProblem(events);

  return (
    <div className="detailed-test-summary">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {Object.entries(problems).map(([problem, problemEvents]) => (
        <div key={problem} className="problem mb-6">
          <h3 className="text-xl font-semibold mb-2 text-blue-600">
            Problem {problem}
          </h3>
          {problemEvents.map((event, eventIndex) => {
            const firstEventTime = parseISO(
              problemEvents[0].timestamp,
            ).getTime();
            const eventTime = parseISO(event.timestamp).getTime();
            const timeDiff = eventTime - firstEventTime;

            return (
              <div key={`${problem}-event-${eventTime}`} className="event mb-1">
                <span className="timestamp text-gray-600 mr-2">
                  {formatTime(event.timestamp)}
                </span>
                {eventIndex > 0 && (
                  <span className="differential text-red-600 mr-2">
                    {formatDifferential(timeDiff)}
                  </span>
                )}
                <span>{renderEventText(event)}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default DetailedTestSummary;
