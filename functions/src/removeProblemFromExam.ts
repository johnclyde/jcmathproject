import type { Request } from "express";
import { FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import type { ExamData, ProblemReference } from "./types";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

const removeProblemFromExamHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{ success: boolean; message?: string; error?: string }> => {
  const { examId, problemId } = req.body.data as {
    examId: string;
    problemId: string;
  };
  logger.info(
    `Removing problem ${problemId} from exam ${examId} by user ${uid}`,
  );

  try {
    // Check if the user is an admin
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    if (!userData || !userData.isAdmin) {
      return {
        success: false,
        error: "Unauthorized: Only admin users can remove problems from exams",
      };
    }

    // Start a transaction to ensure consistency
    await db.runTransaction(async (transaction) => {
      // Get the exam document
      const examRef = db.collection("exams").doc(examId);
      const examDoc = await transaction.get(examRef);

      if (!examDoc.exists) {
        throw new Error("Exam not found");
      }

      const examData = examDoc.data() as ExamData;
      if (!examData) {
        throw new Error("Exam data is null");
      }

      // Remove the problem from the exam's problems array
      const updatedProblems = examData.problems.filter(
        (p: ProblemReference) => p.problemId !== problemId,
      );
      transaction.update(examRef, { problems: updatedProblems });

      // Update the problem document to remove the exam reference
      const problemRef = db.collection("problems").doc(problemId);
      transaction.update(problemRef, {
        [`examRefs.${examId}`]: FieldValue.delete(),
      });
    });

    logger.info(
      `Problem ${problemId} successfully removed from exam ${examId}`,
    );
    return { success: true, message: "Problem removed from exam successfully" };
  } catch (error) {
    logger.error(
      `Error removing problem ${problemId} from exam ${examId}:`,
      error,
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to remove problem from exam",
    };
  }
};

export const removeProblemFromExam = (deps: Dependencies) =>
  createAuthenticatedFunction(removeProblemFromExamHandler, deps);
