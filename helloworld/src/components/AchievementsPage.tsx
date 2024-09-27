import { Brain, Medal, Star, Trophy, Users } from "lucide-react";

const achievements = [
  {
    id: 1,
    name: "Test Master",
    description: "Take 10 tests",
    icon: Trophy,
    progress: 7,
    goal: 10,
  },
  {
    id: 2,
    name: "Team Player",
    description: "Participate in 5 team tests",
    icon: Users,
    progress: 3,
    goal: 5,
  },
  {
    id: 3,
    name: "Problem Solver",
    description: "Answer 100 problems",
    icon: Brain,
    progress: 75,
    goal: 100,
  },
  {
    id: 4,
    name: "Olympiad Enthusiast",
    description: "Complete tests from 5 different olympiads",
    icon: Medal,
    progress: 2,
    goal: 5,
  },
  {
    id: 5,
    name: "Perfect Score",
    description: "Get a perfect score on any test",
    icon: Star,
    progress: 0,
    goal: 1,
  },
];

const AchievementCard = ({ achievement }) => {
  const progress = (achievement.progress / achievement.goal) * 100;
  const Icon = achievement.icon;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center mb-2">
        <Icon className="w-6 h-6 mr-2 text-blue-500" />
        <h3 className="text-lg font-semibold">{achievement.name}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {achievement.progress} / {achievement.goal}
      </p>
    </div>
  );
};

const AchievementsPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <Trophy className="w-6 h-6 mr-2 text-yellow-500" /> Achievements
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
};

export default AchievementsPage;
