import type { Request } from "express";
import * as logger from "firebase-functions/logger";
import type { ExamData } from "./types";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

interface LabelProblemData {
  examId: string;
  problemId: string;
  label: string;
}

const labelProblemForExamHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> => {
  const { examId, problemId, label } = req.body.data as LabelProblemData;
  logger.info(
    `Labeling problem ${problemId} for exam ${examId} by user ${uid}`,
  );

  try {
    // Check if the user is an admin
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    if (!userData || !userData.isAdmin) {
      return {
        success: false,
        error: "Unauthorized: Only admin users can label problems for exams",
      };
    }

    // Start a transaction to ensure consistency
    await db.runTransaction(async (transaction) => {
      const examRef = db.collection("exams").doc(examId);
      const problemRef = db.collection("problems").doc(problemId);

      const [examDoc, problemDoc] = await Promise.all([
        transaction.get(examRef),
        transaction.get(problemRef),
      ]);

      if (!examDoc.exists) {
        throw new Error("Exam not found");
      }
      if (!problemDoc.exists) {
        throw new Error("Problem not found");
      }

      const examData = examDoc.data() as ExamData;
      const updatedProblems = [...examData.problems, { problemId, label }];
      transaction.update(examRef, { problems: updatedProblems });

      const problemData = problemDoc.data();
      if (!problemData) {
        throw new Error("Problem data is undefined");
      }
      const updatedExamRefs = {
        ...(problemData.examRefs || {}),
        [examId]: label,
      };
      transaction.update(problemRef, { examRefs: updatedExamRefs });
    });

    logger.info(`Problem ${problemId} successfully labeled for exam ${examId}`);
    return {
      success: true,
      message: "Problem successfully labeled for exam",
    };
  } catch (error) {
    logger.error(
      `Error labeling problem ${problemId} for exam ${examId}:`,
      error,
    );
    return {
      success: false,
      error: "Failed to label problem for exam",
    };
  }
};

export const labelProblemForExam = (deps: Dependencies) =>
  createAuthenticatedFunction(labelProblemForExamHandler, deps);
