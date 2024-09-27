import type { Request } from "express";
import type { Firestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import type {
  ChallengeData,
  ChallengeRun,
  ChallengeType,
  ExamData,
  ProblemDetails,
  ProblemReference,
} from "./types";
import { type Dependencies, createAuthenticatedFunction } from "./utils";

/**
 * Creates a new challenge for the specified exam and challenge type.
 *
 * @param {Firestore} db - The Firestore instance.
 * @param {string} examId - The ID of the exam.
 * @param {ChallengeType} challengeType - The type of challenge to create.
 * @return {Promise<Challenge>} The newly created challenge.
 * @throws Will throw an error if the exam isn't found or there's an issue creating the challenge.
 */
async function createNewChallenge(
  db: Firestore,
  examId: string,
  challengeType: ChallengeType,
): Promise<ChallengeData> {
  logger.info(`Creating new ${challengeType} challenge for exam ${examId}`);

  try {
    const examRef = db.collection("exams").doc(examId);
    const examDoc = await examRef.get();

    if (!examDoc.exists) {
      logger.error(`Exam ${examId} not found`);
      throw new Error("The specified exam does not exist.");
    }

    const examData = examDoc.data() as ExamData;
    if (!examData || !examData.name || !examData.year) {
      logger.error(
        `Invalid data for exam ${examId}: ${JSON.stringify(examData)}`,
      );
      throw new Error("Invalid exam data.");
    }

    const problemsSnapshot = await db.collection("problems").get();
    const examProblems: {
      [key: string]: { id: string; examId: string; knownAs: string };
    } = {};
    for (const doc of problemsSnapshot.docs) {
      const data = doc.data();
      if (data.knownAs) {
        examProblems[data.knownAs] = {
          id: doc.id,
          examId: data.examId,
          knownAs: data.knownAs,
        };
      }
    }

    let challengeName: string;
    const examIds: Set<string> = new Set([examId]);

    const year = examData.year;
    const examName = examData.name;
    const examType = examData.examType;

    const problems: ProblemReference[] = [];

    if (challengeType === "firstTen") {
      for (let i = 1; i <= 10; i++) {
        const key = `#${i} on the ${year} ${examName}`;
        logger.debug(`Looking for problem key: ${key}`);
        if (examProblems[key]) {
          problems.push({
            problemId: examProblems[key].id,
            examId: examProblems[key].id,
            label: i.toString(),
          });
        }
      }
      challengeName = `First Ten Challenge for ${year} ${examName}`;
    } else if (challengeType === "11-15" || challengeType === "16-20") {
      const startNumber = challengeType === "11-15" ? 11 : 16;
      const endNumber = startNumber + 4;
      for (const version of ["A", "B"]) {
        for (let i = startNumber; i <= endNumber; i++) {
          const key = `#${i} on the ${year} ${examType}${version}`;
          logger.debug(`Looking for problem key: ${key}`);
          if (examProblems[key]) {
            problems.push({
              problemId: examProblems[key].id,
              examId: examProblems[key].id,
              label: `${i}${version}`,
            });
          }
        }
      }
      challengeName = `${challengeType} Challenge for ${year} ${examType} Exams`;
    } else {
      for (let i = 1; i <= 25; i++) {
        const key = `#${i} on the ${year} ${examName}`;
        logger.debug(`Looking for problem key: ${key}`);
        if (examProblems[key]) {
          problems.push({
            problemId: examProblems[key].id,
            examId: examProblems[key].id,
            label: i.toString(),
          });
        }
      }
      challengeName = `Full Challenge for ${year} ${examName}`;
    }

    const newChallenge: Omit<ChallengeData, "id"> = {
      examIds: Array.from(examIds),
      type: challengeType,
      examType: examData.examType,
      problems: problems,
      createdAt: new Date().toISOString(),
      name: challengeName,
    };

    logger.debug(`Creating new challenge: ${JSON.stringify(newChallenge)}`);
    const challengeRef = await db.collection("challenges").add(newChallenge);
    logger.info(`New challenge created with ID: ${challengeRef.id}`);

    return {
      id: challengeRef.id,
      ...newChallenge,
    };
  } catch (error) {
    logger.error(`Error creating new challenge: ${error}`);
    throw new Error("Failed to create new challenge.");
  }
}

const startChallengeHandler = async (
  req: Request,
  uid: string,
  { db }: Dependencies,
): Promise<{ challengeRun: ChallengeRun }> => {
  const { examId, challengeType } = req.body.data as {
    examId: string;
    challengeType: ChallengeType;
  };
  logger.info(
    `Starting ${challengeType} challenge for exam ${examId} by user ${uid}`,
  );

  try {
    const examRef = db.collection("exams").doc(examId);
    const examDoc = await examRef.get();
    logger.debug(`Fetched exam document: ${JSON.stringify(examDoc.data())}`);

    if (!examDoc.exists) {
      logger.error(`Exam ${examId} not found`);
      throw new Error("The specified exam does not exist.");
    }

    const examData = examDoc.data() as ExamData;
    logger.debug(`Exam data: ${JSON.stringify(examData)}`);

    let existingChallengeQuery: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;
    if (challengeType === "11-15" || challengeType === "16-20") {
      const examNameParts = examData.name.split("-");
      const examType = examData.examType;
      const year = examNameParts[examNameParts.length - 1];

      existingChallengeQuery = await db
        .collection("challenges")
        .where(
          "name",
          "==",
          `${challengeType} Challenge for ${year} ${examType} Exams`,
        )
        .limit(1)
        .get();
    } else {
      existingChallengeQuery = await db
        .collection("challenges")
        .where("examIds", "array-contains", examId)
        .where("type", "==", challengeType)
        .limit(1)
        .get();
    }

    let challenge: ChallengeData;

    if (!existingChallengeQuery.empty) {
      const challengeDoc = existingChallengeQuery.docs[0];
      const challengeData = challengeDoc.data() as Omit<ChallengeData, "id">;
      challenge = {
        id: challengeDoc.id,
        ...challengeData,
      };
      logger.info(
        `Existing ${challengeType} challenge found for exam ${examData.name} and user ${uid}`,
      );
    } else {
      challenge = await createNewChallenge(db, examId, challengeType);
      logger.info(
        `New ${challengeType} challenge created for exam ${examData.name} and user ${uid}`,
      );
    }

    const challengeRun: ChallengeRun = {
      id: "", // This will be set after adding to Firestore
      challenge: challenge,
      userId: uid,
      startedAt: new Date().toISOString(),
      completedAt: null,
      responses: {},
      actions: [
        {
          type: "createChallengeRun",
          timestamp: new Date().toISOString(),
        },
      ],
    };

    logger.debug(`Creating new challenge run: ${JSON.stringify(challengeRun)}`);
    const challengeRunRef = await db
      .collection("challengeRuns")
      .add(challengeRun);
    logger.info(`New challenge run created with ID: ${challengeRunRef.id}`);

    challengeRun.id = challengeRunRef.id;

    // Fetch problem details and merge with problem references
    const challengeProblems = await Promise.all(
      challenge.problems.map(async (problem) => {
        const problemDoc = await db
          .collection("problems")
          .doc(problem.problemId)
          .get();

        const problemData = problemDoc.data() as ProblemDetails & {
          details?: ProblemDetails;
        };

        // Normalize the problem structure
        const normalizedProblem = {
          ...problem,
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

    // Attach the detailed problems to the challenge
    challenge.problems = challengeProblems;

    return { challengeRun: { ...challengeRun, challenge } };
  } catch (error) {
    logger.error(`Error in startChallenge function: ${error}`);
    throw new Error("An error occurred while starting the challenge.");
  }
};

export const startChallenge = (deps: Dependencies) =>
  createAuthenticatedFunction(startChallengeHandler, deps);
