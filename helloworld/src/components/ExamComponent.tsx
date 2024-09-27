import { getFunctions, httpsCallable } from "firebase/functions";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getIdToken } from "../firebase";
import type { ChallengeData, ChallengeRun, Exam } from "../types";
import CreateExam from "./CreateExam";
import ExamContent from "./ExamContent";
import ExamEditor from "./ExamEditor";
import PhilosophyModal from "./PhilosophyModal";
import TrainingModal from "./TrainingModal";

const ExamComponent: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showPhilosophyModal, setShowPhilosophyModal] = useState(false);
  const [showExamContent, setShowExamContent] = useState(false);
  const [challengeRun, setChallengeRun] = useState<ChallengeRun | null>(null);

  const { currentUser, isAdminMode } = useAuth();
  const navigate = useNavigate();

  const refreshChallengeState = useCallback(
    async (storedChallengeRun: ChallengeRun) => {
      try {
        const idToken = await getIdToken();
        const functions = getFunctions();

        const getChallengeDetailsFunction = httpsCallable<
          { challengeId: string; idToken: string },
          { challenge: ChallengeData }
        >(functions, "getChallengeDetails");

        const detailsResult = await getChallengeDetailsFunction({
          challengeId: storedChallengeRun.challenge.id,
          idToken,
        });

        storedChallengeRun.challenge = detailsResult.data.challenge;
        setChallengeRun(storedChallengeRun);

        console.log("Refreshed Challenge Run:", storedChallengeRun);

        setShowExamContent(true);
      } catch (err) {
        console.error("Error refreshing challenge state:", err);
        setError("Failed to refresh challenge state. Please try again.");
      }
    },
    [],
  );

  useEffect(() => {
    const fetchExamData = async () => {
      if (examId === "new") {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const idToken = await getIdToken();
        const functions = getFunctions();
        const getExam = httpsCallable<
          { examId: string; idToken: string },
          { exam: Exam }
        >(functions, "getExam");
        const result = await getExam({ examId, idToken });
        setExam(result.data.exam);
        setError(null);

        const storedChallengeRun = localStorage.getItem(`challenge_${examId}`);

        if (isAdminMode) {
          setShowExamContent(true);
        } else if (!storedChallengeRun) {
          setShowTrainingModal(true);
        } else {
          await refreshChallengeState(JSON.parse(storedChallengeRun));
        }
      } catch (err) {
        console.error("Error fetching exam data:", err);
        setError("Failed to load exam data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExamData();
    }
  }, [examId, isAdminMode, refreshChallengeState]);

  const startChallenge = async (type: string): Promise<void> => {
    try {
      const idToken = await getIdToken();
      const functions = getFunctions();
      const startChallengeFunction = httpsCallable<
        { examId: string; challengeType: string; idToken: string },
        { challengeRun: ChallengeRun }
      >(functions, "startChallenge");
      const result = await startChallengeFunction({
        examId,
        challengeType: type,
        idToken,
      });

      setChallengeRun(result.data.challengeRun);

      localStorage.setItem(
        `challenge_${examId}`,
        JSON.stringify(result.data.challengeRun),
      );

      setShowTrainingModal(false);
      setShowExamContent(true);
    } catch (err) {
      console.error(`Error starting ${type} challenge:`, err);
      setError(`Failed to start ${type} challenge. Please try again.`);
    }
  };

  const handleStartExam = () => {
    setShowTrainingModal(false);
    setShowExamContent(true);
  };

  const handleFinish = () => {
    localStorage.removeItem(`challenge_${examId}`);
    navigate("/");
  };

  if (loading) {
    return <div className="p-6 text-center">Loading exam data...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  if (examId === "new") {
    return <CreateExam />;
  }

  if (!exam) {
    return <div className="p-6 text-center">No exam data available.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{exam.title}</h1>
      {showExamContent &&
        (isAdminMode ? (
          <ExamEditor exam={exam} />
        ) : (
          challengeRun && (
            <ExamContent
              exam={exam}
              challengeRun={challengeRun}
              challengeProblems={challengeRun.challenge.problems}
              onFinish={handleFinish}
            />
          )
        ))}
      <TrainingModal
        exam={exam}
        isOpen={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
        onTakeExam={handleStartExam}
        onStartChallenge={startChallenge}
        onViewPhilosophy={() => setShowPhilosophyModal(true)}
      />
      <PhilosophyModal
        isOpen={showPhilosophyModal}
        onClose={() => setShowPhilosophyModal(false)}
      />
    </div>
  );
};

export default ExamComponent;
