import type { Request } from "express";
import * as logger from "firebase-functions/logger";
import type { UpdateExamData } from "./types";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

const updateExamHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{ success: boolean; message?: string }> => {
  const { examId, examType, problemsToConvert } = req.body
    .data as UpdateExamData;
  logger.info(`Updating exam ${examId} to type ${examType} for user ${uid}`);

  try {
    // Check if the user is an admin
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    if (!userData || !userData.isAdmin) {
      return {
        success: false,
        message: "Unauthorized: Only admin users can update exams",
      };
    }

    const examRef = db.collection("exams").doc(examId);
    const examDoc = await examRef.get();

    if (!examDoc.exists) {
      return { success: false, message: "Exam not found" };
    }

    // Update exam type
    await examRef.update({ examType });

    // Convert problems if needed
    if (problemsToConvert && problemsToConvert.length > 0) {
      const batch = db.batch();
      for (const problemId of problemsToConvert) {
        const problemRef = db.collection("problems").doc(problemId);
        const problemDoc = await problemRef.get();

        if (!problemDoc.exists) {
          logger.warn(`Problem ${problemId} not found, skipping conversion`);
          continue;
        }

        let updateData = {};
        switch (examType) {
          case "AMC-8":
          case "AMC-10":
          case "AMC-12":
            updateData = {
              "details.type": "multiple_choice",
              "details.options": {
                A: "",
                B: "",
                C: "",
                D: "",
                E: "",
              },
              "details.correctAnswer": "",
            };
            break;
          case "AIME":
          case "ARML":
            updateData = {
              "details.type": "short_answer",
              "details.correctAnswer": "",
            };
            break;
          case "Olympiad":
            updateData = {
              "details.type": "essay",
              "details.solutionGuidelines": "",
            };
            break;
          default:
            // For 'other' exam types, we won't change the problem type
            logger.info(
              `Skipping problem type conversion for exam type: ${examType}`,
            );
            continue;
        }

        batch.update(problemRef, updateData);
      }
      await batch.commit();
    }

    logger.info(`Exam ${examId} updated successfully`);
    return { success: true, message: "Exam updated successfully" };
  } catch (error) {
    logger.error(`Error updating exam ${examId}:`, error);
    return { success: false, message: "Failed to update exam" };
  }
};

export const updateExam = (deps: Dependencies) =>
  createAuthenticatedFunction(updateExamHandler, deps);
