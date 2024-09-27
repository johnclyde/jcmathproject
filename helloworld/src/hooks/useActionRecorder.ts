import { getFunctions, httpsCallable } from "firebase/functions";
import { useCallback, useState } from "react";
import { getIdToken } from "../firebase";
import type { Action, ActionType } from "../types";

const useActionRecorder = (challengeRunId: string) => {
  const [actionLog, setActionLog] = useState<Action[]>([]);

  const createAction = useCallback(
    (
      type: ActionType,
      problemLabel?: string,
      data?: Record<string, unknown>,
    ): Action => {
      return {
        type,
        timestamp: new Date().toISOString(),
        problemLabel,
        data,
      };
    },
    [],
  );

  const recordAction = useCallback(
    async (action: Action) => {
      try {
        const functions = getFunctions();
        const recordActionFunction = httpsCallable(functions, "recordAction");
        const idToken = await getIdToken();

        await recordActionFunction({
          idToken,
          challengeRunId,
          action,
        });

        setActionLog((prevLog) => [...prevLog, action]);
      } catch (error) {
        console.error("Error recording action:", error);
      }
    },
    [challengeRunId],
  );

  const loadActionsFromAPI = useCallback(async () => {
    try {
      const functions = getFunctions();
      const loadActionsFunction = httpsCallable(functions, "loadActions");
      const idToken = await getIdToken();

      const result = await loadActionsFunction({ idToken, challengeRunId });

      const loadedActions = result.data as Action[];
      if (loadedActions.length > 0) {
        setActionLog(loadedActions);
      }
    } catch (error) {
      console.error("Error loading actions:", error);
    }
  }, [challengeRunId]);

  const seedInitialAction = useCallback(() => {
    const initialAction = createAction("loadSavedState");
    setActionLog([initialAction]);
  }, [createAction]);

  const recordOpenProblem = useCallback(
    (problemLabel: string) => {
      const action = createAction("openProblem", problemLabel);
      recordAction(action);
    },
    [createAction, recordAction],
  );

  const recordNavigateAway = useCallback(
    (problemLabel: string) => {
      const action = createAction("navigateAway", problemLabel);
      recordAction(action);
    },
    [createAction, recordAction],
  );

  const recordSubmitAnswer = useCallback(
    (problemLabel: string, answer: string, timeSpent: number) => {
      const action = createAction("submitAnswer", problemLabel, {
        answer,
        timeSpent,
      });
      recordAction(action);
    },
    [createAction, recordAction],
  );

  const recordSkipProblem = useCallback(
    (problemLabel: string) => {
      const action = createAction("skipProblem", problemLabel);
      recordAction(action);
    },
    [createAction, recordAction],
  );

  const recordViewAllProblems = useCallback(() => {
    const action = createAction("viewAllProblems");
    recordAction(action);
  }, [createAction, recordAction]);

  const recordViewSingleProblem = useCallback(
    (problemLabel: string) => {
      const action = createAction("viewSingleProblem", problemLabel);
      recordAction(action);
    },
    [createAction, recordAction],
  );

  return {
    actionLog,
    recordAction,
    loadActionsFromAPI,
    seedInitialAction,
    recordOpenProblem,
    recordNavigateAway,
    recordSubmitAnswer,
    recordSkipProblem,
    recordViewAllProblems,
    recordViewSingleProblem,
  };
};

export default useActionRecorder;
