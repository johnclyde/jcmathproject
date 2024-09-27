import { getFunctions, httpsCallable } from "firebase/functions";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getIdToken } from "../firebase";
import type { Action, ChallengeRun } from "../types";
import DetailedTestSummary, { type Event } from "./DetailedTestSummary";

interface EnhancedAction extends Action {
  userName?: string;
  challengeName?: string;
  examName?: string;
}

interface PopulateResult {
  message: string;
  stats: {
    actionsAlreadyPresent: number;
    actionsAdded: number;
    challengeRunsProcessed: number;
  };
}

interface RunData {
  actions: EnhancedAction[];
  firstActionDate: Date;
  lastActionDate: Date;
  challengeName?: string;
  examName?: string;
}

interface GroupedActions {
  [userId: string]: {
    userName: string;
    runs: {
      [challengeRunId: string]: RunData;
    };
  };
}

interface ChallengeRunModalProps {
  challengeRun: ChallengeRun;
  onClose: () => void;
  onDelete: () => void;
}

const transformActionsToEvents = (actions: EnhancedAction[]): Event[] => {
  return actions.map((action) => ({
    type: action.type,
    timestamp: action.timestamp,
    problemLabel: action.problemLabel || "N/A",
    data: JSON.stringify(action.data) || "N/A",
  }));
};

const ChallengeRunModal: React.FC<ChallengeRunModalProps> = ({
  challengeRun,
  onClose,
  onDelete,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Challenge Run Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            type="submit"
          >
            <X size={24} />
          </button>
        </div>
        <DetailedTestSummary
          events={transformActionsToEvents(challengeRun.actions)}
          title={`Actions for Challenge Run ${challengeRun.id}`}
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={onDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mr-2"
            type="submit"
          >
            Delete Challenge Run
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            type="submit"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminActionsPage: React.FC = () => {
  const [groupedActions, setGroupedActions] = useState<GroupedActions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedChallengeRun, setSelectedChallengeRun] =
    useState<ChallengeRun | null>(null);
  const [populateResult, setPopulateResult] = useState<PopulateResult | null>(
    null,
  );
  const { currentUser, isAdminMode } = useAuth();
  const functions = getFunctions();

  const fetchActions = useCallback(async () => {
    if (!currentUser || !isAdminMode) return;

    try {
      setLoading(true);
      const idToken = await getIdToken();
      const fetchActionsFunction = httpsCallable(
        functions,
        "adminFetchActions",
      );

      const result = await fetchActionsFunction({
        idToken,
        date: currentDate.toISOString(),
      });

      const actions = (result.data as { actions: EnhancedAction[] }).actions;

      const grouped: GroupedActions = {};
      for (const action of actions) {
        if (!grouped[action.userId]) {
          grouped[action.userId] = {
            userName: action.userName || "Unknown",
            runs: {},
          };
        }
        if (!grouped[action.userId].runs[action.challengeRunId]) {
          grouped[action.userId].runs[action.challengeRunId] = {
            actions: [],
            firstActionDate: new Date(action.timestamp),
            lastActionDate: new Date(action.timestamp),
            challengeName: action.challengeName,
            examName: action.examName,
          };
        }
        grouped[action.userId].runs[action.challengeRunId].actions.push(action);
        const actionDate = new Date(action.timestamp);
        if (
          actionDate <
          grouped[action.userId].runs[action.challengeRunId].firstActionDate
        ) {
          grouped[action.userId].runs[action.challengeRunId].firstActionDate =
            actionDate;
        }
        if (
          actionDate >
          grouped[action.userId].runs[action.challengeRunId].lastActionDate
        ) {
          grouped[action.userId].runs[action.challengeRunId].lastActionDate =
            actionDate;
        }
      }

      setGroupedActions(grouped);
      setError(null);
    } catch (err) {
      console.error("Error fetching actions:", err);
      setError("Failed to load actions. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [currentUser, isAdminMode, functions, currentDate]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const changeDate = (days: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  };

  const handlePopulateActions = async () => {
    if (!currentUser || !isAdminMode) return;

    try {
      setLoading(true);
      const idToken = await getIdToken();
      const populateActionsFunction = httpsCallable(
        functions,
        "populateActions",
      );
      const result = await populateActionsFunction({ idToken });
      setPopulateResult(result.data as PopulateResult);
      await fetchActions();
    } catch (err) {
      console.error("Error populating actions:", err);
      setError("Failed to populate actions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallengeRun = async () => {
    if (!selectedChallengeRun) return;

    try {
      const idToken = await getIdToken();
      const deleteChallengeRunFunction = httpsCallable(
        functions,
        "deleteChallengeRun",
      );
      await deleteChallengeRunFunction({
        idToken,
        challengeRunId: selectedChallengeRun.id,
      });
      setSelectedChallengeRun(null);
      await fetchActions();
    } catch (err) {
      console.error("Error deleting challenge run:", err);
      setError("Failed to delete challenge run. Please try again later.");
    }
  };

  const isRunVisible = (firstDate: Date, lastDate: Date) => {
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    return firstDate <= endOfDay && lastDate >= startOfDay;
  };

  if (!isAdminMode) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Actions Page</h1>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => changeDate(-1)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          type="submit"
        >
          Previous Day
        </button>
        <span className="text-xl font-bold">{currentDate.toDateString()}</span>
        <button
          onClick={() => changeDate(1)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          type="submit"
        >
          Next Day
        </button>
      </div>
      <button
        onClick={handlePopulateActions}
        className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
        type="submit"
      >
        Populate All Actions
      </button>
      {populateResult && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 rounded">
          <h2 className="font-bold">Populate Result:</h2>
          <p>{populateResult.message}</p>
          <ul>
            <li>
              Actions already present:{" "}
              {populateResult.stats.actionsAlreadyPresent}
            </li>
            <li>New actions added: {populateResult.stats.actionsAdded}</li>
            <li>
              Challenge runs processed:{" "}
              {populateResult.stats.challengeRunsProcessed}
            </li>
          </ul>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {loading ? (
        <p>Loading actions...</p>
      ) : (
        <div>
          {Object.entries(groupedActions).map(([userId, userData]) => (
            <div key={userId} className="mb-4 border rounded">
              <div
                className="flex items-center p-2 bg-gray-100 cursor-pointer"
                onClick={() =>
                  setExpandedUsers((prev) => {
                    const newSet = new Set(prev);
                    if (newSet.has(userId)) {
                      newSet.delete(userId);
                    } else {
                      newSet.add(userId);
                    }
                    return newSet;
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setExpandedUsers((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has(userId)) {
                        newSet.delete(userId);
                      } else {
                        newSet.add(userId);
                      }
                      return newSet;
                    });
                  }
                }}
                tabIndex={0}
                role="button"
              >
                {expandedUsers.has(userId) ? <ChevronDown /> : <ChevronRight />}
                <span className="font-bold ml-2">
                  User: {userData.userName}
                </span>
              </div>
              {expandedUsers.has(userId) && (
                <div className="p-2">
                  {Object.entries(userData.runs).map(([runId, runData]) => {
                    if (
                      !isRunVisible(
                        runData.firstActionDate,
                        runData.lastActionDate,
                      )
                    )
                      return null;
                    return (
                      <div key={runId} className="mb-2 border-l-2 pl-2">
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() =>
                            setExpandedRuns((prev) => {
                              const newSet = new Set(prev);
                              if (newSet.has(runId)) {
                                newSet.delete(runId);
                              } else {
                                newSet.add(runId);
                              }
                              return newSet;
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setExpandedRuns((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(runId)) {
                                  newSet.delete(runId);
                                } else {
                                  newSet.add(runId);
                                }
                                return newSet;
                              });
                            }
                          }}
                          tabIndex={0}
                          role="button"
                        >
                          {expandedRuns.has(runId) ? (
                            <ChevronDown />
                          ) : (
                            <ChevronRight />
                          )}
                          <span className="font-semibold ml-2">
                            {runData.challengeName || "Unknown Challenge"}
                            {runData.examName ? ` for ${runData.examName}` : ""}
                            <span className="text-sm text-gray-500 ml-2">
                              ({runData.firstActionDate.toLocaleDateString()} -{" "}
                              {runData.lastActionDate.toLocaleDateString()})
                            </span>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChallengeRun({
                                id: runId,
                                actions: runData.actions,
                              } as ChallengeRun);
                            }}
                            className="ml-2 bg-blue-500 text-white px-2 py-1 rounded text-sm"
                            type="submit"
                          >
                            View Details
                          </button>
                        </div>
                        {expandedRuns.has(runId) && (
                          <DetailedTestSummary
                            events={transformActionsToEvents(runData.actions)}
                            title={`Actions for ${runData.challengeName || "Unknown Challenge"}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {selectedChallengeRun && (
        <ChallengeRunModal
          challengeRun={selectedChallengeRun}
          onClose={() => setSelectedChallengeRun(null)}
          onDelete={handleDeleteChallengeRun}
        />
      )}
    </div>
  );
};

export default AdminActionsPage;
