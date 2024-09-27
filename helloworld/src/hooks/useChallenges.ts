import { useCallback, useEffect, useState } from "react";
import { getIdToken } from "../firebase";

interface Challenge {
  id: string;
  name: string;
  description: string;
  sourceExam: string;
  problems: number[];
  maxScore: number;
  userProgress?: {
    completedAt: string;
    score: number;
    problemResponses: {
      [key: string]: {
        answer: string;
        correct: boolean;
        timeSpent: number;
      };
    };
  };
}

const useChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const idToken = await getIdToken();
      const response = await fetch("/api/challenges", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch challenges");
      }

      const data = await response.json();
      setChallenges(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching challenges:", err);
      setError("Failed to load challenges. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const submitChallengeResponse = async (
    challengeId: string,
    responses: { [key: string]: { answer: string; timeSpent: number } },
  ) => {
    try {
      const idToken = await getIdToken();
      const response = await fetch("/api/submit-challenge", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ challengeId, responses }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit challenge response");
      }

      const result = await response.json();

      // Update the local state with the new progress
      setChallenges(
        challenges.map((challenge) =>
          challenge.id === challengeId
            ? {
                ...challenge,
                userProgress: {
                  completedAt: new Date().toISOString(),
                  score: result.score,
                  problemResponses: Object.fromEntries(
                    Object.entries(responses).map(
                      ([problemNumber, response]) => [
                        problemNumber,
                        {
                          answer: response.answer,
                          correct:
                            result.score > (challenge.userProgress?.score || 0),
                          timeSpent: response.timeSpent,
                        },
                      ],
                    ),
                  ),
                },
              }
            : challenge,
        ),
      );

      return result;
    } catch (err) {
      console.error("Error submitting challenge response:", err);
      throw err;
    }
  };

  return {
    challenges,
    loading,
    error,
    fetchChallenges,
    submitChallengeResponse,
  };
};

export default useChallenges;
