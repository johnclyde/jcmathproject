import type { Firestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

interface Exam {
  id: string;
  competition: string;
  year: string;
  exam: string;
  name: string; // Same as exam but Firestore probably stores it as name.
  isPrivate: boolean;
}

/**
 * Loads all non-private exams from the database.
 * @param {Firestore} db - The Firestore database instance.
 * @return {Promise<Exam[]>} A promise that resolves to an array of Exam objects.
 */
export async function loadExams(db: Firestore): Promise<Exam[]> {
  logger.info("Fetching exams from the exams collection");
  try {
    const examsRef = db.collection("exams");
    const snapshot = await examsRef.get();
    const exams = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          exam: data.name,
          ...data,
        } as Exam;
      })
      .filter((exam) => exam.isPrivate !== true);
    logger.info(`Successfully fetched ${exams.length} exams`);
    return exams;
  } catch (error) {
    logger.error("Error fetching exams:", error);
    throw new Error("Failed to fetch exams from the database");
  }
}
