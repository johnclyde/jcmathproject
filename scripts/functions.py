import git
from pathlib import Path

# Initialize Git repository
repo_path = Path('.').absolute()
try:
    repo = git.Repo(repo_path)
except git.exc.InvalidGitRepositoryError:
    print("Initializing a new Git repository...")
    repo = git.Repo.init(repo_path)

def search_files(pattern: str) -> list:
    """
    Searches for files matching the given pattern in filenames and file contents.
    Returns a list of unique matching file paths.
    """
    matching_files = set()

    # Search filenames using git ls-files with glob pattern
    try:
        filename_matches = repo.git.ls_files('--', f'*{pattern}*').split('\n')
        matching_files.update(filter(None, filename_matches))
    except git.exc.GitCommandError:
        pass  # No filename matches found

    # Search file contents using git grep
    try:
        content_matches = repo.git.grep('-l', pattern).split('\n')
        matching_files.update(filter(None, content_matches))
    except git.exc.GitCommandError:
        pass  # No content matches found

    return sorted(matching_files)

def read_file_content(file_path: str) -> str:
    """
    Reads and returns the content of the specified file.
    """
    try:
        with open(file_path, 'r') as f:
            return f.read()
    except Exception as e:
        return f"Error reading {file_path}: {str(e)}"

def write_file_content(file_path: str, content: str) -> str:
    """
    Writes the provided content to the specified file.
    """
    try:
        with open(file_path, 'w') as f:
            f.write(content)
        return f"Successfully wrote to {file_path}."
    except Exception as e:
        return f"Error writing to {file_path}: {str(e)}"

def commit_changes(message: str) -> str:
    """
    Commits staged changes with the provided commit message.
    """
    try:
        repo.index.commit(message)
        return "Changes committed successfully."
    except Exception as e:
        return f"Error committing changes: {str(e)}"

def get_git_status() -> str:
    """
    Returns the current Git status.
    """
    try:
        status = repo.git.status()
        return status
    except Exception as e:
        return f"Error retrieving Git status: {str(e)}"
