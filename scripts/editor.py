import json
import os
import sys
from pathlib import Path

import git
import openai
import requests

from scripts.functions import (
    commit_changes,
    get_git_status,
    read_file_content,
    search_files,
    write_file_content,
)

# ==================== Configuration ====================

# Load API keys from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

if not OPENAI_API_KEY:
    print(
        "Error: OpenAI API key not found. Please set the OPENAI_API_KEY environment variable."
    )
    sys.exit(1)

if not ANTHROPIC_API_KEY:
    print(
        "Error: Anthropic API key not found. Please set the ANTHROPIC_API_KEY environment variable."
    )
    sys.exit(1)

# Initialize OpenAI
openai.api_key = OPENAI_API_KEY

# Initialize Git repository
repo_path = Path(".").absolute()
try:
    repo = git.Repo(repo_path)
except git.exc.InvalidGitRepositoryError:
    print("Initializing a new Git repository...")
    repo = git.Repo.init(repo_path)

# Log file path
LOG_FILE = "session.log"

# Default model
DEFAULT_MODEL = "gpt-4o"

# Define available functions for OpenAI to call
AVAILABLE_FUNCTIONS = [
    {
        "name": "search_files",
        "description": "Search for files matching a given pattern using git grep.",
        "parameters": {
            "type": "object",
            "properties": {
                "pattern": {
                    "type": "string",
                    "description": "The file name or pattern to search for.",
                }
            },
            "required": ["pattern"],
        },
    },
    {
        "name": "read_file_content",
        "description": "Read and return the content of a specified file.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "The path to the file to be read.",
                }
            },
            "required": ["file_path"],
        },
    },
    {
        "name": "write_file_content",
        "description": "Write content to a specified file.",
        "parameters": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "The path to the file to be written.",
                },
                "content": {
                    "type": "string",
                    "description": "The content to write to the file.",
                },
            },
            "required": ["file_path", "content"],
        },
    },
    {
        "name": "commit_changes",
        "description": "Commit staged changes with a provided commit message.",
        "parameters": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "The commit message."}
            },
            "required": ["message"],
        },
    },
    {
        "name": "get_git_status",
        "description": "Retrieve the current Git status.",
        "parameters": {"type": "object", "properties": {}},
    },
]

# ==================== Helper Functions ====================


def log_interaction(message: str):
    """Logs messages to the session log."""
    with open(LOG_FILE, "a") as f:
        f.write(message + "\n")


def get_user_input(prompt: str) -> str:
    """Gets input from the user."""
    user_input = input(prompt)
    log_interaction(f"User: {user_input}")
    return user_input


def send_to_openai(messages: list) -> dict:
    """
    Sends messages to OpenAI and returns the response.
    Handles function calling if invoked by the model.
    """
    try:
        response = openai.ChatCompletion.create(
            model=DEFAULT_MODEL,
            messages=messages,
            functions=AVAILABLE_FUNCTIONS,
            function_call="auto",  # Let the model decide when to call functions
            temperature=0.3,
        )
        return response
    except Exception as e:
        log_interaction(f"OpenAI Error: {str(e)}")
        return {"error": f"Error communicating with OpenAI: {str(e)}"}


def send_to_claude(prompt: str, context: str = "") -> str:
    """Sends a prompt to Claude and returns the response."""
    try:
        # Anthropic's API uses a different endpoint and payload structure
        url = "https://api.anthropic.com/v1/complete"
        headers = {"Content-Type": "application/json", "X-API-Key": ANTHROPIC_API_KEY}
        # Combine context and prompt
        combined_prompt = f"{context}{prompt}\n\n###\n"
        data = {
            "prompt": combined_prompt,
            "model": "claude-v1",  # Replace with the desired Claude model
            "max_tokens_to_sample": 500,
            "temperature": 0.3,
            "stop_sequences": ["###"],
        }
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response.raise_for_status()
        res_json = response.json()
        reply = res_json["completion"].strip()
        log_interaction("Claude: " + reply)
        return reply
    except Exception as e:
        log_interaction(f"Claude Error: {str(e)}")
        return f"Error communicating with Claude: {str(e)}"


def send_to_model(user_message: str, messages: list) -> dict:
    """
    Determines which model to use based on user input and sends the message accordingly.
    """
    if "use claude" in user_message.lower():
        # Remove the directive from the message
        clean_message = user_message.lower().replace("use claude", "").strip()
        # Send to Claude
        response = send_to_claude(clean_message, context=generate_context(messages))
        # Log and return
        log_interaction(f"Assistant (Claude): {response}")
        return {"content": response, "model": "claude"}
    else:
        # Default to OpenAI's model
        response = send_to_openai(messages)
        return {"openai_response": response}


def generate_context(messages: list) -> str:
    """
    Generates context from the conversation history for Claude.
    """
    context = ""
    for msg in messages:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "user":
            context += f"User: {content}\n"
        elif role == "assistant":
            context += f"Assistant: {content}\n"
    return context


def handle_function_call(function_name: str, arguments: dict) -> str:
    """
    Dispatches the function call based on function_name and executes it with arguments.
    """
    try:
        if function_name == "search_files":
            pattern = arguments.get("pattern", "")
            files = search_files(pattern)
            if not files:
                return json.dumps([])
            return json.dumps(files)
        elif function_name == "read_file_content":
            file_path = arguments.get("file_path", "")
            return read_file_content(file_path)
        elif function_name == "write_file_content":
            file_path = arguments.get("file_path", "")
            content = arguments.get("content", "")
            return write_file_content(file_path, content)
        elif function_name == "commit_changes":
            message = arguments.get("message", "")
            return commit_changes(message)
        elif function_name == "get_git_status":
            return get_git_status()
        else:
            return f"Function '{function_name}' is not recognized."
    except Exception as e:
        return f"Error executing function '{function_name}': {str(e)}"


def display_menu():
    """
    Displays dynamic menu options to the user.
    """
    print("\nPlease select an option:")
    print("1. Edit a file")
    print("2. Commit changes")
    print("3. View Git status")
    print("4. Use Claude for a task")
    print("5. Exit")


def process_menu_selection(selection: str, messages: list):
    """
    Handles menu selections to guide user interactions.
    """
    if selection == "1":
        # Edit a file
        file_pattern = get_user_input("Enter the file name or pattern to search for: ")
        files = search_files(file_pattern)
        if not files:
            print(f"No files found matching '{file_pattern}'.")
            log_interaction(f"No files found matching '{file_pattern}'.")
            return
        print("I found the following files matching your query:")
        for idx, file in enumerate(files, 1):
            print(f"{idx}. {file}")
        choice = get_user_input("Enter the number of the file you want to edit: ")
        try:
            choice_num = int(choice)
            if 1 <= choice_num <= len(files):
                selected_file = files[choice_num - 1]
                print(f"Opening `{selected_file}` for editing.")
                log_interaction(f"Opening `{selected_file}` for editing.")
                original_content = read_file_content(selected_file)
                if original_content.startswith("Error"):
                    print(original_content)
                    log_interaction(original_content)
                    return
                print(
                    "Describe the changes you'd like to make (e.g., 'Change the port number to 8080'):"
                )
                edit_command = get_user_input("Your change: ")
                # Generate the modified content using OpenAI
                messages.append(
                    {
                        "role": "user",
                        "content": f"Modify the following file content based on this instruction:\n{edit_command}",
                    }
                )
                messages.append({"role": "assistant", "content": original_content})
                response = send_to_openai(messages)
                if "error" in response:
                    print(response["error"])
                    return
                response_message = response["choices"][0]["message"]
                if response_message.get("function_call"):
                    # Handle function call
                    function_name = response_message["function_call"]["name"]
                    arguments = json.loads(
                        response_message["function_call"]["arguments"]
                    )
                    function_result = handle_function_call(function_name, arguments)
                    # Append function response
                    messages.append(
                        {
                            "role": "function",
                            "name": function_name,
                            "content": function_result,
                        }
                    )
                    # Get assistant's reply
                    second_response = send_to_openai(messages)
                    second_message = second_response["choices"][0]["message"]
                    print(f"\nAssistant: {second_message['content']}")
                    log_interaction(f"Assistant: {second_message['content']}")
                    # Apply change if confirmed
                    if "diff" in second_message["content"]:
                        apply_change = get_user_input(
                            "Do you want to apply this change? (yes/no): "
                        )
                        if apply_change.lower() in ["yes", "y"]:
                            write_file_content(selected_file, function_result)
                            repo.index.add([selected_file])
                            print("Change applied successfully.")
                            log_interaction("Change applied successfully.")
                        else:
                            print("Change discarded.")
                            log_interaction("Change discarded by user.")
                else:
                    # No function call, proceed normally
                    assistant_reply = response_message["content"]
                    print(f"\nAssistant: {assistant_reply}")
                    log_interaction(f"Assistant: {assistant_reply}")
            else:
                print("Invalid choice number.")
        except ValueError:
            print("Please enter a valid number.")
    elif selection == "2":
        # Commit changes
        commit_message = get_user_input("Enter the commit message: ")
        confirmation = get_user_input(
            f"Do you want to commit the changes with the message '{commit_message}'? (yes/no): "
        )
        if confirmation.lower() in ["yes", "y"]:
            commit_result = commit_changes(commit_message)
            print(commit_result)
            log_interaction(commit_result)
        else:
            print("Commit canceled.")
            log_interaction("Commit canceled by user.")
    elif selection == "3":
        # View Git status
        status = get_git_status()
        print("\nGit Status:")
        print(status)
        log_interaction(f"Git Status:\n{status}")
    elif selection == "4":
        # Use Claude for a task
        task_description = get_user_input(
            "Describe the task you'd like Claude to perform: "
        )
        response = send_to_claude(task_description)
        print(f"\nClaude: {response}")
    elif selection == "5":
        # Exit
        print("Goodbye!")
        log_interaction("Session ended by user.")
        sys.exit(0)
    else:
        print("Invalid selection. Please choose a valid option.")


# ==================== Main Loop ====================


def main():
    print("Welcome to the Conversational Editor!")
    log_interaction("Session started.")

    while True:
        display_menu()
        selection = get_user_input("Enter the number of your choice: ")
        process_menu_selection(selection, messages=[])


if __name__ == "__main__":
    main()
