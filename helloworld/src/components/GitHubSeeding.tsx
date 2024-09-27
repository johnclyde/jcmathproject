import type React from "react";
import { useState } from "react";
import { GitHubService } from "../services/GitHubService";
import type { FileContent, PRDiff } from "../types";

const GitHubSeeding: React.FC = () => {
  const [token, setToken] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [path, setPath] = useState("");
  const [pullNumber, setPullNumber] = useState("");

  const handleSeedFromRepo = async () => {
    try {
      const githubService = new GitHubService(token);
      const files: FileContent[] = await githubService.scanRepository(
        owner,
        repo,
        path,
      );
      console.log("Seeded files:", files);
      // Update your file state or storage here
    } catch (error) {
      console.error("Error seeding files from GitHub:", error);
    }
  };

  const handleSeedFromPR = async () => {
    try {
      const githubService = new GitHubService(token);
      const prDiff: PRDiff = await githubService.getPRDiff(
        owner,
        repo,
        Number(pullNumber),
      );
      console.log("Seeded files from PR:", prDiff);
      // Update your file state or storage here
    } catch (error) {
      console.error("Error seeding files from PR:", error);
    }
  };

  return (
    <div>
      <h2>Seed Files from GitHub</h2>
      <input
        placeholder="GitHub Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />
      <input
        placeholder="Owner"
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
      />
      <input
        placeholder="Repository"
        value={repo}
        onChange={(e) => setRepo(e.target.value)}
      />
      <input
        placeholder="Path (optional)"
        value={path}
        onChange={(e) => setPath(e.target.value)}
      />
      <button type="button" onClick={handleSeedFromRepo}>
        Seed from Repository
      </button>

      <h2>Seed Files from Pull Request</h2>
      <input
        placeholder="Pull Request Number"
        value={pullNumber}
        onChange={(e) => setPullNumber(e.target.value)}
      />
      <button type="button" onClick={handleSeedFromPR}>
        Seed from PR
      </button>
    </div>
  );
};

export default GitHubSeeding;
