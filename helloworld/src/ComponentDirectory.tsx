import { Link } from "react-router-dom";

const ComponentDirectory = () => {
  const components = [
    {
      name: "Banzuke Surfer",
      path: "/labs/banzuke-surfer",
      description: "Banzuke Surfing Utility",
    },
    {
      name: "Interactive Counter",
      path: "/labs/interactive-counter",
      description: "A counter with increment and decrement buttons",
    },
    {
      name: "Color Picker",
      path: "/labs/color-picker",
      description: "An interactive color picker with real-time preview",
    },
    {
      name: "Problem Editor Demo",
      path: "/labs/problem-editor-demo",
      description: "Demonstration of the Problem Editor component",
    },
    {
      name: "Login Warning Popup",
      path: "/labs/login-warning-popup",
      description: "Demo of the login warning popup for non-logged-in users",
    },
    {
      name: "GrindOlympiads Index",
      path: "/",
      description: "Index page for GrindOlympiads math platform",
    },
    {
      name: "Challenges",
      path: "/labs/challenges",
      description: "Display and interact with math challenges",
    },
    {
      name: "Settings",
      path: "/labs/settings",
      description: "User settings and preferences",
    },
    {
      name: "User Stats",
      path: "/labs/user-stats",
      description:
        "Display user statistics including problems solved and test scores",
    },
    {
      name: "ChARIArts",
      path: "/labs/chariarts",
      description: "Charting tools by ARIA",
    },
    {
      name: "TubEHILLA",
      path: "/labs/tubehilla",
      description: "TubEHILLA",
    },
    {
      name: "MYfuntiLES",
      path: "/labs/myfuntiles",
      description: "MYfuntiLES",
    },
    {
      name: "Matrix Wizard",
      path: "/labs/matrix-wizard",
      description: "Matrix Wizard",
    },
    {
      name: "Claude IDE",
      path: "/labs/claude-ide",
      description: "Interactive code editor with Claude AI",
    },
    {
      name: "Dual Mode Calculator",
      path: "/labs/dual-mode-calculator",
      description: "Scientific and graphing calculator with switchable modes",
    },
    {
      name: "Achievements",
      path: "/labs/achievements",
      description: "Display user achievements and progress",
    },
    {
      name: "Challenge Status Page",
      path: "/labs/challenge-status-page",
      description: "Demo of the Challenge Status Page",
    },
    {
      name: "Detailed Test Summary",
      path: "/labs/detailed-test-summary",
      description: "Interactive demo of the Detailed Test Summary",
    },
    {
      name: "Test Presentation",
      path: "/labs/test-presentation-demo",
      description: "Test Presentation component for the front page",
    },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">ATLAS Labs</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {components.map((item, index) => (
          <div key={item.path} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
            <p className="text-gray-600 mb-4">{item.description}</p>
            <Link
              to={item.path}
              className="inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              View Component
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComponentDirectory;
