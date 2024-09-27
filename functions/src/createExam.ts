import type { Request } from "express";
import * as logger from "firebase-functions/logger";
import type { ExamData } from "./types";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

interface CreateExamData {
  name: string;
  competition: string;
  year: string;
  examType: ExamData["examType"];
}

const createExamHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{ examId: string }> => {
  const { name, competition, year, examType } = req.body.data as CreateExamData;
  logger.info(`Creating new exam by user ${uid}`);

  try {
    // Check if the user is an admin
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    if (!userData || !userData.isAdmin) {
      logger.error(`Non-admin user ${uid} attempted to create an exam`);
      throw new Error("Unauthorized: Only admin users can create exams");
    }

    // Validate input
    if (!name || !competition || !year || !examType) {
      throw new Error("Missing required fields for exam creation");
    }

    // Create the exam document
    const examData: Omit<ExamData, "id"> = {
      name,
      competition,
      year,
      examType,
      problems: [],
    };

    const examRef = await db.collection("exams").add(examData);
    logger.info(`New exam created with ID: ${examRef.id} by user ${uid}`);
    return { examId: examRef.id };
  } catch (error) {
    logger.error(`Error creating new exam by user ${uid}:`, error);
    throw new Error("Failed to create new exam");
  }
};

export const createExam = (deps: Dependencies) =>
  createAuthenticatedFunction(createExamHandler, deps);
