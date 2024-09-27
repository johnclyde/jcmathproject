import { Octokit } from "@octokit/rest";
import type { FileContent, PRDiff } from "../types/github";

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async scanRepository(
    owner: string,
    repo: string,
    path = "",
  ): Promise<FileContent[]> {
    const files: FileContent[] = [];

    async function scanDirectory(dirPath: string) {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: dirPath,
      });

      for (const item of data) {
        if (item.type === "file") {
          const fileContent = await this.octokit.repos.getContent({
            owner,
            repo,
            path: item.path,
            mediaType: { format: "raw" },
          });
          files.push({
            name: item.name,
            path: item.path,
            content: Buffer.from(fileContent.data as string, "base64").toString(
              "utf-8",
            ),
          });
        } else if (item.type === "dir") {
          await scanDirectory(item.path);
        }
      }
    }

    await scanDirectory(path);
    return files;
  }

  async getPRDiff(
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<PRDiff> {
    const { data: pullRequest } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });

    const { data: files } = await this.octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
    });

    const changes = await Promise.all(
      files.map(async (file) => {
        const { data: contents } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: file.filename,
          ref: pullRequest.head.sha,
        });

        let content = "";
        if ("content" in contents && typeof contents.content === "string") {
          content = Buffer.from(contents.content, "base64").toString("utf-8");
        }

        return {
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
          content,
        };
      }),
    );

    return { pullRequest, changes };
  }
}
