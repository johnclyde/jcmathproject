import json
import sys
from datetime import datetime

import firebase_admin
from firebase_admin import credentials
from google.cloud import firestore_v1


def initialize_firebase():
    """Initializes the Firebase Admin SDK and returns the Firestore client."""
    try:
        with open("mykeyfile.json", "r") as keyfile:
            key_dict = json.load(keyfile)
            project_id = key_dict["project_id"]

        cred = credentials.Certificate("mykeyfile.json")
        firebase_admin.initialize_app(cred)

        db = firestore_v1.Client(project=project_id, database="grindolympiads")
        return db
    except FileNotFoundError:
        print("Firebase key file 'mykeyfile.json' not found.")
        sys.exit(1)
    except json.JSONDecodeError:
        print(
            "Error decoding JSON from 'mykeyfile.json'. Please check the file format."
        )
        sys.exit(1)
    except Exception as e:
        print(f"Failed to initialize Firebase: {e}")
        sys.exit(1)


def get_users(db):
    """Fetches all users from the 'users' collection."""
    users = []
    try:
        users_ref = db.collection("users")
        for doc in users_ref.stream():
            user_data = doc.to_dict()
            users.append(
                {
                    "id": doc.id,
                    "name": user_data.get("name", "Unknown"),
                    "email": user_data.get("email", "Unknown"),
                }
            )
    except Exception as e:
        print(f"Error fetching users: {e}")
    return users


def get_user_challenge_runs(db, user_id):
    """Fetches all challenge runs for a specific user."""
    challenge_runs = []
    try:
        challenge_runs_ref = db.collection("challengeRuns")
        query = challenge_runs_ref.where("userId", "==", user_id)
        for doc in query.stream():
            run_data = doc.to_dict()
            challenge_runs.append(
                {
                    "id": doc.id,
                    "challengeName": run_data.get("challenge", {}).get(
                        "name", "Unknown Challenge"
                    ),
                    "examName": run_data.get("challenge", {}).get(
                        "examName", "Unknown Exam"
                    ),
                    "startedAt": run_data.get("startedAt", "Unknown"),
                    "completedAt": run_data.get("completedAt", "Not completed"),
                    "actions": run_data.get("actions", []),
                    "responses": run_data.get("responses", {}),
                }
            )

        # Sort the challenge runs by 'startedAt' in ascending order
        # Newest runs will appear at the bottom
        challenge_runs.sort(key=lambda x: x.get("startedAt") or "")

    except Exception as e:
        print(f"Error fetching challenge runs for user {user_id}: {e}")
    return challenge_runs


def parse_timestamp(timestamp_str):
    """Parses a timestamp string into a datetime object."""
    try:
        return datetime.strptime(timestamp_str, "%Y-%m-%dT%H:%M:%S.%fZ")
    except ValueError:
        print(f"Invalid timestamp format: {timestamp_str}")
        return None


def analyze_actions(actions):
    """Analyzes user actions to track problem openings and answer submissions."""
    problem_opens = {}
    analyzed_actions = []

    for action in actions:
        action_type = action.get("type")
        problem_label = action.get("problemLabel", "N/A")
        timestamp_str = action.get("timestamp")

        if not timestamp_str:
            analyzed_actions.append(f"- Missing timestamp for action: {action}")
            continue

        timestamp = parse_timestamp(timestamp_str)
        if not timestamp:
            analyzed_actions.append(f"- Invalid timestamp for action: {action}")
            continue

        if action_type == "openProblem":
            problem_opens[problem_label] = timestamp
            analyzed_actions.append(
                f"- {timestamp_str}: Opened problem {problem_label}"
            )
        elif action_type == "submitAnswer":
            open_time = problem_opens.get(problem_label)
            if open_time:
                time_diff = timestamp - open_time
                seconds_diff = time_diff.total_seconds()
                answer = action.get("data", {}).get("answer", "Unknown")
                analyzed_actions.append(
                    f"- {timestamp_str}: Submitted answer '{answer}' for problem {problem_label} "
                    f"({seconds_diff:.2f} seconds after opening)"
                )
            else:
                analyzed_actions.append(
                    f"- {timestamp_str}: Submitted answer for problem {problem_label} "
                    f"(opening time unknown)"
                )
        else:
            analyzed_actions.append(
                f"- {timestamp_str}: Unknown action type '{action_type}'"
            )

    return analyzed_actions


def display_menu(options):
    """Displays a menu of options and returns the selected index."""
    for i, option in enumerate(options, 1):
        print(f"{i}. {option}")
    choice = input("Enter your choice (number): ").strip()
    if not choice.isdigit():
        return -1
    index = int(choice) - 1
    return index if 0 <= index < len(options) else -1


def main():
    db = initialize_firebase()

    try:
        while True:
            print("\nFetching users...")
            users = get_users(db)
            if not users:
                print("No users found.")
                break

            user_names = [f"{user['name']} ({user['email']})" for user in users]
            user_names.append("Exit")

            print("\nSelect a user:")
            choice = display_menu(user_names)

            if choice == len(user_names) - 1 or choice == -1:
                print("Exiting. Goodbye!")
                break

            selected_user = users[choice]
            user_id = selected_user["id"]

            print(f"\nFetching challenge runs for {selected_user['name']}...")
            challenge_runs = get_user_challenge_runs(db, user_id)

            if not challenge_runs:
                print(f"No challenge runs found for {selected_user['name']}")
                continue

            challenge_options = [
                f"{run['challengeName']} ({run['examName']}) - Started: {run['startedAt']}"
                for run in challenge_runs
            ]
            challenge_options.append("Back to user selection")

            print(f"\nSelect a challenge run for {selected_user['name']}:")
            run_choice = display_menu(challenge_options)

            if run_choice == len(challenge_options) - 1 or run_choice == -1:
                continue

            selected_run = challenge_runs[run_choice]

            print(f"\nAnalyzing actions for {selected_run['challengeName']}...")
            all_actions = selected_run.get("actions", []).copy()

            responses = selected_run.get("responses", {})
            for problem, response_data in responses.items():
                problem_actions = response_data.get("actions", [])
                for action in problem_actions:
                    action["problemLabel"] = problem
                all_actions.extend(problem_actions)

            all_actions = [action for action in all_actions if action.get("timestamp")]

            all_actions.sort(key=lambda x: x["timestamp"])
            analyzed_actions = analyze_actions(all_actions)

            print(
                f"\nChallenge: {selected_run['challengeName']} ({selected_run['examName']})"
            )
            print(f"Started: {selected_run['startedAt']}")
            print(f"Completed: {selected_run['completedAt']}")
            print("\nActions:")
            for action in analyzed_actions:
                print(action)

            input("\nPress Enter to continue...")

    except KeyboardInterrupt:
        print("\nOperation cancelled by user. Exiting.")
    except Exception as e:
        print(f"\n=== Error ===\nAn unexpected error occurred: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
