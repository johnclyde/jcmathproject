import argparse
import os
import sys
from datetime import datetime

import git
from git import Repo

# Define NULL_TREE for initial commit diffs
NULL_TREE = git.NULL_TREE


def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")


def list_branches(repo):
    branches = [head.name for head in repo.heads]
    print("Available Branches:")
    for idx, branch in enumerate(branches, start=1):
        print(f"{idx}. {branch}")
    return branches


def select_branch(branches, prompt="Select a branch [1-{}] or 'e' to exit: "):
    while True:
        try:
            choice = input(prompt.format(len(branches))).strip().lower()
            if choice == "e":
                print("Exiting.")
                sys.exit(0)
            choice = int(choice)
            if 1 <= choice <= len(branches):
                return branches[choice - 1]
            else:
                print(f"Enter a number between 1 and {len(branches)}, or 'e' to exit.")
        except ValueError:
            print("Invalid input. Please enter a valid number or 'e' to exit.")


def choose_merge_base(repo, branch, base_branch):
    merge_bases = repo.merge_base(branch, base_branch)

    if not merge_bases:
        print(f"No common ancestor between '{branch}' and '{base_branch}'.")
        sys.exit(1)
    elif len(merge_bases) == 1:
        return merge_bases[0]
    else:
        for idx, mb in enumerate(merge_bases, start=1):
            print(f"{idx}. {mb.hexsha} - {mb.summary}")
        while True:
            try:
                choice = (
                    input(
                        f"Select the merge base [1-{len(merge_bases)}] or 'e' to exit: "
                    )
                    .strip()
                    .lower()
                )
                if choice == "e":
                    print("Exiting.")
                    sys.exit(0)
                choice = int(choice)
                if 1 <= choice <= len(merge_bases):
                    selected_base = merge_bases[choice - 1]
                    return selected_base
                else:
                    print(
                        f"Enter a number between 1 and {len(merge_bases)}, or 'e' to exit."
                    )
            except ValueError:
                print("Invalid input. Please enter a valid number or 'e' to exit.")


def iterate_unique_commits(repo, branch_name, base_branch="origin/main"):
    branch = repo.heads[branch_name]
    base = choose_merge_base(repo, branch, base_branch)

    print(f"\nUsing merge base: {base.hexsha} - {base.summary}\n")

    # Get commits unique to branch since divergence
    commits = list(repo.iter_commits(f"{base.hexsha}..{branch_name}"))
    commits.reverse()  # Start from the oldest commit

    if not commits:
        print(
            f"No unique commits in branch '{branch_name}' since diverging from '{base_branch}'."
        )
        input("Press Enter to return to branch selection...")
        return

    commit_index = 0
    total_commits = len(commits)

    while True:
        commit = commits[commit_index]
        clear_screen()
        print(f"Commit {commit_index + 1}/{total_commits} (Since '{base_branch}')")
        print(f"Commit: {commit.hexsha}")
        print(f"Author: {commit.author.name} <{commit.author.email}>")
        print(
            f"Date: {datetime.fromtimestamp(commit.committed_date).strftime('%Y-%m-%d %H:%M:%S')}"
        )
        print(
            f"\nMessage: {commit.message.splitlines()[0]}\n"
        )  # Display only the first line of the commit message

        # List files changed
        try:
            diffs = (
                commit.diff(commit.parents[0], create_patch=False)
                if commit.parents
                else commit.diff(NULL_TREE, create_patch=False)
            )
            files_changed = set()
            for diff in diffs:
                if diff.a_path:
                    files_changed.add(diff.a_path)
                if diff.b_path:
                    files_changed.add(diff.b_path)
            print("Files Changed:")
            for file in sorted(files_changed):
                print(f" - {file}")
        except Exception as e:
            print(f"Could not retrieve files changed: {e}")

        print("\nOptions:")
        print("n - Next commit")
        print("p - Previous commit")
        print("d - View diff of this commit")
        print("b - Back to branch selection")
        print("e - Exit script")
        print("a - Annotate purpose of the branch")

        action = input("Choose an option [n/p/d/b/e/a]: ").strip().lower()
        if action == "n":
            if commit_index < total_commits - 1:
                commit_index += 1
            else:
                print("You're at the latest commit.")
                input("Press Enter to continue...")
        elif action == "p":
            if commit_index > 0:
                commit_index -= 1
            else:
                print("You're at the first commit.")
                input("Press Enter to continue...")
        elif action == "d":
            view_diff(commit)
        elif action == "b":
            return  # Immediately return to branch selection
        elif action == "e":
            print("Exiting.")
            sys.exit(0)
        elif action == "a":
            purpose = input("Enter the purpose of this branch: ").strip()
            if purpose:
                with open("branch_purposes.txt", "a") as f:
                    f.write(f"Branch '{branch_name}': {purpose}\n")
                print("Purpose annotated.")
            else:
                print("No input provided. Skipping annotation.")
            input("Press Enter to continue...")
        else:
            print("Invalid option.")
            input("Press Enter to continue...")


def view_diff(commit):
    clear_screen()
    print(f"Viewing diff for commit {commit.hexsha}")
    print(f"Author: {commit.author.name} <{commit.author.email}>")
    print(
        f"Date: {datetime.fromtimestamp(commit.committed_date).strftime('%Y-%m-%d %H:%M:%S')}"
    )
    print(f"\nMessage:\n{commit.message}\n")
    print("Diff:\n")
    try:
        diffs = (
            commit.diff(commit.parents[0], create_patch=True)
            if commit.parents
            else commit.diff(NULL_TREE, create_patch=True)
        )
        for diff in diffs:
            diff_text = diff.diff.decode("utf-8", errors="ignore")
            print(diff_text)
    except Exception as e:
        print(f"Could not generate diff: {e}")
    input("\nPress Enter to return to commit view...")


def main():
    parser = argparse.ArgumentParser(
        description="Inspect Git branches and their unique commits."
    )
    parser.add_argument(
        "repo_path",
        nargs="?",
        default=".",
        help="Path to the Git repository (default: current directory)",
    )
    parser.add_argument(
        "--base",
        default="origin/main",
        help="Base branch to compare against (default: 'origin/main')",
    )
    args = parser.parse_args()

    try:
        repo = Repo(args.repo_path, search_parent_directories=True)
    except git.exc.InvalidGitRepositoryError:
        print("Must run inside a Git repository.")
        sys.exit(1)
    except Exception as e:
        print(f"Error accessing repository: {e}")
        sys.exit(1)

    if repo.bare:
        print("Repository is bare. Exiting.")
        sys.exit(1)

    while True:
        clear_screen()
        branches = list_branches(repo)
        branch_name = select_branch(branches)
        if branch_name == args.base:
            print(f"'{args.base}' is the base branch. No unique commits to display.")
            input("Press Enter to return to branch selection...")
            continue
        iterate_unique_commits(repo, branch_name, base_branch=args.base)
        # Loops back to branch selection automatically


if __name__ == "__main__":
    main()
