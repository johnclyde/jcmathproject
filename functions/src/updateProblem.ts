import type { Request } from "express";
import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {
  type AIMEProblemDetails,
  type AMCProblemDetails,
  type OlympiadProblemDetails,
  type ProblemDetails,
  isAIMEProblem,
  isAMCProblem,
  isOlympiadProblem,
} from "./types";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

type PartialAMCProblemDetails = Partial<AMCProblemDetails>;
type PartialAIMEProblemDetails = Partial<AIMEProblemDetails>;
type PartialOlympiadProblemDetails = Partial<OlympiadProblemDetails>;

type PartialProblemDetails =
  | PartialAMCProblemDetails
  | PartialAIMEProblemDetails
  | PartialOlympiadProblemDetails;

interface UpdateProblemData {
  examId: string;
  problemId: string;
  updatedProblem: PartialProblemDetails;
}

interface ProblemDocument {
  details: ProblemDetails;
  examRefs: {
    [examId: string]: string;
  };
}

const updateProblemHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  data?: { problemId: string };
}> => {
  const { examId, problemId, updatedProblem } = req.body
    .data as UpdateProblemData;
  logger.info(
    `Updating problem ${problemId} for exam ${examId} by user ${uid}`,
  );

  try {
    // Check if the user is an admin
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    if (!userData || !userData.isAdmin) {
      return {
        success: false,
        error: "Unauthorized: Only admin users can update problems",
      };
    }

    const problemRef = db.collection("problems").doc(problemId);
    const problemDoc = await problemRef.get();

    if (!problemDoc.exists) {
      logger.error(`Problem ${problemId} not found`);
      return { success: false, error: "Problem not found" };
    }

    const problemData = problemDoc.data() as ProblemDocument;
    const existingDetails = problemData.details;

    // Merge the updated problem details with the existing details
    let mergedDetails: ProblemDetails;

    if (isAMCProblem(existingDetails)) {
      const updatedAMC = updatedProblem as PartialAMCProblemDetails;
      mergedDetails = {
        ...existingDetails,
        ...updatedAMC,
        type: "multiple_choice",
        correctAnswer:
          updatedAMC.correctAnswer && updatedAMC.correctAnswer.trim() !== ""
            ? updatedAMC.correctAnswer
            : existingDetails.correctAnswer,
        options: updatedAMC.options
          ? { ...existingDetails.options, ...updatedAMC.options }
          : existingDetails.options,
        diagrams:
          updatedAMC.diagrams !== undefined
            ? updatedAMC.diagrams
            : existingDetails.diagrams,
      };
    } else if (isAIMEProblem(existingDetails)) {
      const updatedAIME = updatedProblem as PartialAIMEProblemDetails;
      mergedDetails = {
        ...existingDetails,
        ...updatedAIME,
        type: "short_answer",
        correctAnswer:
          updatedAIME.correctAnswer && updatedAIME.correctAnswer.trim() !== ""
            ? updatedAIME.correctAnswer
            : existingDetails.correctAnswer,
        diagrams:
          updatedAIME.diagrams !== undefined
            ? updatedAIME.diagrams
            : existingDetails.diagrams,
      };
    } else if (isOlympiadProblem(existingDetails)) {
      const updatedOlympiad = updatedProblem as PartialOlympiadProblemDetails;
      mergedDetails = {
        ...existingDetails,
        ...updatedOlympiad,
        type: "essay",
        diagrams:
          updatedOlympiad.diagrams !== undefined
            ? updatedOlympiad.diagrams
            : existingDetails.diagrams,
      };
    } else {
      throw new Error("Unknown problem type");
    }

    // Update the problem details
    problemData.details = mergedDetails;

    // Update the problem document
    await problemRef.set(problemData, { merge: true });

    // Create an audit trail entry
    const auditRef = db.collection("problemAudit").doc();
    await auditRef.set({
      problemId: problemId,
      examId: examId,
      previousVersion: problemDoc.data(),
      newVersion: problemData,
      editedBy: uid,
      editedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`Problem ${problemId} updated successfully`);
    return {
      success: true,
      message: "Problem updated successfully",
      data: { problemId: problemId },
    };
  } catch (error) {
    logger.error(`Error updating problem ${problemId}:`, error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update problem",
    };
  }
};

export const updateProblem = (deps: Dependencies) =>
  createAuthenticatedFunction(updateProblemHandler, deps);
