import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Action,
  ChallengeRun,
  ProblemReference,
  TimestampedResponse,
} from "../types";
import useActionRecorder from "./useActionRecorder";

interface ProblemTimer {
  firstTimer: number;
  secondTimer: number;
  firstTimerLocked: boolean;
}

const useExamNavigation = (
  challengeRun: ChallengeRun,
  challengeProblems: ProblemReference[],
) => {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [problemResponses, setProblemResponses] = useState<
    Record<string, TimestampedResponse[]>
  >({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string | null>
  >({});
  const [problemTimers, setProblemTimers] = useState<
    Record<string, ProblemTimer>
  >({});
  const [totalTimePaused, setTotalTimePaused] = useState(0);
  const [visitedProblems, setVisitedProblems] = useState<boolean[]>([]);
  const [pauseAfterSubmission, setPauseAfterSubmission] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showAllProblems, setShowAllProblems] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const {
    actionLog,
    recordNavigateAway,
    recordOpenProblem,
    recordSubmitAnswer,
    recordSkipProblem,
    loadActionsFromAPI,
    seedInitialAction,
    recordViewAllProblems,
    recordViewSingleProblem,
  } = useActionRecorder(challengeRun.id);

  const problems = challengeProblems;

  const lastActionTimeRef = useRef<number>(
    new Date(challengeRun.startedAt).getTime(),
  );
  const currentProblemLabelRef = useRef<string | null>(null);

  useEffect(() => {
    console.log("useExamNavigation State:", {
      currentProblemIndex,
      problemResponses,
      problemTimers,
      visitedProblems,
      challengeType: challengeRun.challenge.type,
      problems: challengeProblems,
    });
  }, [
    currentProblemIndex,
    problemResponses,
    problemTimers,
    visitedProblems,
    challengeRun,
    challengeProblems,
  ]);

  useEffect(() => {
    // Initialize problem timers
    const initialProblemTimers: Record<string, ProblemTimer> = {};
    for (const problem of problems) {
      initialProblemTimers[problem.label] = {
        firstTimer: 0,
        secondTimer: 0,
        firstTimerLocked: false,
      };
    }
    setProblemTimers(initialProblemTimers);
    setVisitedProblems(new Array(problems.length).fill(false));
  }, [problems]);

  useEffect(() => {
    // Process actionLog to compute timers
    const sortedActions = [...actionLog].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const challengeStartTime = new Date(challengeRun.startedAt).getTime();
    let lastActionTime = challengeStartTime;
    let currentProblemLabel: string | null = null;

    const newProblemTimers: Record<string, ProblemTimer> = {};
    for (const problem of problems) {
      newProblemTimers[problem.label] = {
        firstTimer: 0,
        secondTimer: 0,
        firstTimerLocked: false,
      };
    }

    let newTotalTimePaused = 0;

    for (const action of sortedActions) {
      const actionTime = new Date(action.timestamp).getTime();
      const timeDiff = actionTime - lastActionTime;

      if (currentProblemLabel === null) {
        newTotalTimePaused += timeDiff;
      } else {
        const timer = newProblemTimers[currentProblemLabel];
        if (timer.firstTimerLocked) {
          timer.secondTimer += timeDiff;
        } else {
          timer.firstTimer += timeDiff;
        }
      }

      switch (action.type) {
        case "openProblem":
          currentProblemLabel = action.problemLabel || null;
          break;
        case "submitAnswer":
          if (currentProblemLabel) {
            newProblemTimers[currentProblemLabel].firstTimerLocked = true;
          }
          break;
        case "navigateAway":
          currentProblemLabel = null;
          break;
        default:
          break;
      }

      lastActionTime = actionTime;
    }

    // Handle time since last action
    const now = Date.now();
    const timeSinceLastAction = now - lastActionTime;

    if (currentProblemLabel === null) {
      newTotalTimePaused += timeSinceLastAction;
    } else {
      const timer = newProblemTimers[currentProblemLabel];
      if (timer.firstTimerLocked) {
        timer.secondTimer += timeSinceLastAction;
      } else {
        timer.firstTimer += timeSinceLastAction;
      }
    }

    // Update state
    setProblemTimers(newProblemTimers);
    setTotalTimePaused(newTotalTimePaused);
    lastActionTimeRef.current = now;
    currentProblemLabelRef.current = currentProblemLabel;
  }, [actionLog, challengeRun.startedAt, problems]);

  useEffect(() => {
    // Live timer updates
    const interval = setInterval(() => {
      const now = Date.now();
      const timeDiff = now - lastActionTimeRef.current;

      if (currentProblemLabelRef.current === null) {
        setTotalTimePaused((prev) => prev + timeDiff);
      } else {
        setProblemTimers((prev) => {
          const updatedTimers = { ...prev };
          const currentLabel = currentProblemLabelRef.current;

          if (currentLabel) {
            let timer = updatedTimers[currentLabel];

            if (!timer) {
              // Initialize the timer object if it doesn't exist
              timer = { firstTimer: 0, secondTimer: 0, firstTimerLocked: false };
              updatedTimers[currentLabel] = timer;
            }

            if (timer.firstTimerLocked) {
              timer.secondTimer += timeDiff;
            } else {
              timer.firstTimer += timeDiff;
            }
          }

          return updatedTimers;
        });
      }

      lastActionTimeRef.current = now;
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const navigateToProblem = useCallback(
    (newIndex: number) => {
      console.log("Navigating to problem:", {
        newIndex,
        currentIndex: currentProblemIndex,
      });
      if (newIndex >= 0 && newIndex < problems.length) {
        recordNavigateAway(problems[currentProblemIndex].label);
        setCurrentProblemIndex(newIndex);
        setVisitedProblems((prev) => {
          const updated = [...prev];
          updated[newIndex] = true;
          return updated;
        });
        recordOpenProblem(problems[newIndex].label);
      } else if (newIndex >= problems.length) {
        setIsComplete(true);
      }
    },
    [problems, currentProblemIndex, recordNavigateAway, recordOpenProblem],
  );

  const handleAnswer = useCallback(
    (answer: string) => {
      console.log("Handling answer:", { answer, currentProblemIndex });
      const problemLabel = problems[currentProblemIndex].label;

      const timestamp = Date.now();
      const response: TimestampedResponse = { answer, timestamp };

      setProblemResponses((prev) => {
        const previousResponses = prev[problemLabel] || [];
        return {
          ...prev,
          [problemLabel]: [...previousResponses, response],
        };
      });

      setSelectedAnswers((prev) => ({ ...prev, [problemLabel]: null }));
      recordSubmitAnswer(
        problemLabel,
        answer,
        problemTimers[problemLabel].firstTimer,
      );

      setProblemTimers((prev) => ({
        ...prev,
        [problemLabel]: {
          ...prev[problemLabel],
          firstTimerLocked: true,
        },
      }));

      if (pauseAfterSubmission) {
        setIsPaused(true);
      } else if (autoSubmit) {
        navigateToProblem(currentProblemIndex + 1);
      }
    },
    [
      problems,
      currentProblemIndex,
      recordSubmitAnswer,
      problemTimers,
      navigateToProblem,
      pauseAfterSubmission,
      autoSubmit,
    ],
  );

  const handleOptionSelect = (problemLabel: string, answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [problemLabel]: answer }));
  };

  const handleContinue = useCallback(() => {
    setIsPaused(false);
    navigateToProblem(currentProblemIndex + 1);
  }, [currentProblemIndex, navigateToProblem]);

  const handleSkip = useCallback(() => {
    console.log("handle skip on ", currentProblemIndex);
    recordSkipProblem(problems[currentProblemIndex].label);
    navigateToProblem(currentProblemIndex + 1);
  }, [currentProblemIndex, problems, navigateToProblem, recordSkipProblem]);

  const handlePrevious = useCallback(() => {
    navigateToProblem(currentProblemIndex - 1);
  }, [currentProblemIndex, navigateToProblem]);

  const handleNext = useCallback(() => {
    navigateToProblem(currentProblemIndex + 1);
  }, [currentProblemIndex, navigateToProblem]);

  const toggleShowAllProblems = useCallback(() => {
    setShowAllProblems((prev) => {
      const newValue = !prev;
      if (newValue) {
        recordViewAllProblems();
      } else {
        recordViewSingleProblem(problems[currentProblemIndex].label);
      }
      return newValue;
    });
  }, [
    currentProblemIndex,
    problems,
    recordViewAllProblems,
    recordViewSingleProblem,
  ]);

  const canNavigatePrevious = currentProblemIndex > 0;
  const canNavigateNext = currentProblemIndex < problems.length - 1;

  // Load and save state functions
  const loadSavedState = useCallback(() => {
    const savedState = localStorage.getItem(`examState_${challengeRun.id}`);
    if (savedState) {
      const state = JSON.parse(savedState);
      setCurrentProblemIndex(state.currentProblemIndex);
      setProblemResponses(state.problemResponses);
      setAnswers(state.answers);
      setSelectedAnswers(state.selectedAnswers);
      setProblemTimers(state.problemTimers);
      setVisitedProblems(state.visitedProblems);
      setIsComplete(state.isComplete);
      setTotalTimePaused(state.totalTimePaused);
      setPauseAfterSubmission(state.pauseAfterSubmission);
      setAutoSubmit(state.autoSubmit);
      setIsPaused(state.isPaused);
      setShowAllProblems(state.showAllProblems);

      if (actionLog.length === 0) {
        seedInitialAction();
        loadActionsFromAPI();
      }
    }
  }, [
    challengeRun.id,
    actionLog.length,
    seedInitialAction,
    loadActionsFromAPI,
  ]);

  const saveCurrentState = useCallback(() => {
    const state = {
      currentProblemIndex,
      problemResponses,
      answers,
      selectedAnswers,
      problemTimers,
      visitedProblems,
      isComplete,
      totalTimePaused,
      pauseAfterSubmission,
      autoSubmit,
      isPaused,
      showAllProblems,
    };
    localStorage.setItem(`examState_${challengeRun.id}`, JSON.stringify(state));
  }, [
    challengeRun.id,
    currentProblemIndex,
    problemResponses,
    answers,
    selectedAnswers,
    problemTimers,
    visitedProblems,
    isComplete,
    totalTimePaused,
    pauseAfterSubmission,
    autoSubmit,
    isPaused,
    showAllProblems,
  ]);

  useEffect(() => {
    loadSavedState();
  }, [loadSavedState]);

  useEffect(() => {
    saveCurrentState();
  }, [saveCurrentState]);

  return {
    currentProblemIndex,
    problemResponses,
    selectedAnswers,
    problemTimers,
    totalTimePaused,
    visitedProblems,
    pauseAfterSubmission,
    setPauseAfterSubmission,
    autoSubmit,
    setAutoSubmit,
    isPaused,
    actionLog,
    problems,
    navigateToProblem,
    handleAnswer,
    handleOptionSelect,
    handleSkip,
    handlePrevious,
    handleNext,
    handleContinue,
    showAllProblems,
    toggleShowAllProblems,
    isComplete,
    setIsComplete,
    loadActionsFromAPI,
    seedInitialAction,
    canNavigatePrevious,
    canNavigateNext,
    loadSavedState,
    saveCurrentState,
  };
};

export default useExamNavigation;
