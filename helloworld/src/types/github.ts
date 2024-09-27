import type { RestEndpointMethodTypes } from "@octokit/rest";

export interface FileContent {
  name: string;
  path: string;
  content: string;
}

export interface FileChange {
  filename: string;
  status:
    | "added"
    | "removed"
    | "modified"
    | "renamed"
    | "copied"
    | "changed"
    | "unchanged";
  additions: number;
  deletions: number;
  changes: number;
  content: string;
}

export interface PRDiff {
  pullRequest: RestEndpointMethodTypes["pulls"]["get"]["response"]["data"];
  changes: FileChange[];
}
