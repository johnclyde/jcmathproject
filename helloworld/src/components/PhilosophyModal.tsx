import type React from "react";

interface PhilosophyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PhilosophyModal: React.FC<PhilosophyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg max-w-3xl w-full">
        <h2 className="text-3xl font-bold mb-6">Our Training Philosophy</h2>
        <div className="space-y-4">
          <p>
            We believe that effective training comes from targeted practice and
            strategic decision-making. Our approach is based on several key
            principles:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Balanced Challenge:</strong> We believe that in any given
              test you are likely to take:
              <ul className="list-disc list-inside ml-6 mt-2">
                <li>
                  20% of the problems might be at your optimal difficulty level
                </li>
                <li>
                  At least 80% of the problems will be too easy or too hard for
                  effective training
                </li>
              </ul>
            </li>
            <li>
              <strong>Time Management:</strong> Success in math competitions
              often hinges on finding the optimal balance between speed and
              accuracy.
            </li>
            <li>
              <strong>Self-Assessment:</strong> By engaging in speedruns
              followed by answer checking, you gain data-driven insights into
              your optimal strategy for answer checking in the live exam.
            </li>
            <li>
              <strong>Continuous Improvement:</strong> Regular engagement with
              our training system helps you track your progress and continuously
              refine your approach to math competitions.
            </li>
          </ol>
          <p>
            By focusing on problems that are just right for your current skill
            level and collecting timestamped data to inform your strategic
            decisions, we aim to maximize your training efficiency and
            competition performance.
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition-colors text-lg"
            type="submit"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhilosophyModal;
