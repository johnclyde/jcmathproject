import type { Request } from "express";
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import type { ExamData, ProblemDocument } from "./types";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

const examDataHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{ exam: ExamData }> => {
  const { examId } = req.body.data;
  logger.info("Fetching exam data for exam", examId);

  try {
    // Fetch the exam document
    const examRef = db.collection("exams").doc(examId);
    const examDoc = await examRef.get();

    if (!examDoc.exists) {
      logger.warn(`Exam with ID ${examId} not found`);
      throw new functions.https.HttpsError("not-found", "Exam not found");
    }

    const examData = examDoc.data() as ExamData;

    // Fetch and flatten problem details into the examData's problems array
    const problemsWithDetails = await Promise.all(
      examData.problems.map(async (problemRef) => {
        const problemDoc = await db
          .collection("problems")
          .doc(problemRef.problemId)
          .get();

        if (problemDoc.exists) {
          const problemData = problemDoc.data() as ProblemDocument;
          return {
            ...problemRef,
            ...problemData.details,
          };
        }
        logger.warn(`Problem with ID ${problemRef.problemId} not found`);
        return problemRef; // Return the original ref if problem is not found
      }),
    );

    logger.info("Exam data fetched successfully", examId);
    return {
      exam: {
        ...examData,
        id: examId,
        problems: problemsWithDetails,
      },
    };
  } catch (error) {
    logger.error("Error fetching exam data:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error fetching exam data",
    );
  }
};

export const getExam = (deps: Dependencies) =>
  createAuthenticatedFunction(examDataHandler, deps);
