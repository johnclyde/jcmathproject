import type { Request } from "express";
import * as logger from "firebase-functions/logger";
import type { ChallengeData, ProblemDetails } from "./types";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

export const getChallengeDetailsHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{ challenge: ChallengeData }> => {
  const { challengeId } = req.body.data as { challengeId: string };
  logger.info(`Fetching challenge details for challenge ${challengeId}`);

  try {
    const challengeRef = db.collection("challenges").doc(challengeId);
    const challengeDoc = await challengeRef.get();

    if (!challengeDoc.exists) {
      throw new Error("Challenge not found");
    }

    const challenge = {
      ...(challengeDoc.data() as Omit<ChallengeData, "problems">),
    } as ChallengeData;

    const problemDetails = await Promise.all(
      challenge.problems.map(async (problemRef) => {
        const problemDoc = await db
          .collection("problems")
          .doc(problemRef.problemId)
          .get();
        if (!problemDoc.exists) {
          throw new Error(`Problem ${problemRef.problemId} not found`);
        }
        const problemData = problemDoc.data() as ProblemDetails & {
          details?: ProblemDetails;
        };

        // Normalize the problem structure
        const normalizedProblem = {
          ...problemRef,
          ...problemData,
          ...(problemData.details || {}), // Merge details if it exists
        };

        // Remove the nested details object if it exists
        if (normalizedProblem.details) {
          normalizedProblem.details = undefined;
        }

        return normalizedProblem;
      }),
    );

    return { challenge: { ...challenge, problems: problemDetails } };
  } catch (error) {
    logger.error(`Error fetching challenge details: ${error}`);
    throw new Error("Failed to fetch challenge details");
  }
};

export const getChallengeDetails = (deps: Dependencies) =>
  createAuthenticatedFunction(getChallengeDetailsHandler, deps);
