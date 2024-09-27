import datetime
import json

import firebase_admin
from firebase_admin import credentials
from google.cloud import firestore_v1

# Initialize Firebase Admin SDK
with open("mykeyfile.json", "r") as keyfile:
    key_dict = json.load(keyfile)
    project_id = key_dict["project_id"]

cred = credentials.Certificate("mykeyfile.json")
firebase_admin.initialize_app(cred)

# Get a reference to the Firestore database
db = firestore_v1.Client(project=project_id, database="grindolympiads")


def populate_actions(batch_size=100):
    # Reference to the challengeRuns collection
    challenge_runs_ref = db.collection("challengeRuns")
    # Reference to the actions collection (will be created if it doesn't exist)
    actions_ref = db.collection("actions")

    # Get all challenge runs in batches
    query = challenge_runs_ref.limit(batch_size)
    last_doc = None
    all_actions = []

    while True:
        if last_doc:
            query = query.start_after(last_doc)

        docs = list(query.stream())
        if not docs:
            break

        for run in docs:
            run_data = run.to_dict()
            run_id = run.id

            # Process top-level actions
            top_level_actions = run_data.get("actions", [])
            for action in top_level_actions:
                action["challengeRunId"] = run_id
                action["userId"] = run_data.get("userId")
                all_actions.append(action)

            # Process problem-specific actions
            responses = run_data.get("responses", {})
            for problem_label, problem_data in responses.items():
                problem_actions = problem_data.get("actions", [])
                for action in problem_actions:
                    action["challengeRunId"] = run_id
                    action["userId"] = run_data.get("userId")
                    action["problemLabel"] = problem_label
                    all_actions.append(action)

        print(f"Processed {len(docs)} challenge runs")
        last_doc = docs[-1]

    # Sort all actions chronologically
    all_actions.sort(key=lambda x: x["timestamp"])

    # Add sorted actions to actions collection in batches
    return add_actions_to_collection(actions_ref, all_actions)


def add_actions_to_collection(
    actions_ref: firestore_v1.CollectionReference,
    sorted_actions: list[dict],
    batch_size=500,
):
    # Fetch all existing action IDs
    existing_actions = set(doc.id for doc in actions_ref.stream())

    batch = db.batch()
    total_actions = len(sorted_actions)
    actions_added = 0
    actions_already_present = 0

    for i, action in enumerate(sorted_actions):
        timestamp = datetime.datetime.fromisoformat(
            action["timestamp"].replace("Z", "+00:00")
        )
        doc_id = timestamp.strftime("%Y%m%d%H%M%S%f")

        if doc_id in existing_actions:
            actions_already_present += 1
        else:
            batch.set(actions_ref.document(doc_id), action)
            actions_added += 1

        if (i + 1) % batch_size == 0 or i == total_actions - 1:
            # Commit the batch
            batch.commit()
            print(f"Processed {min(i + 1, total_actions)} / {total_actions} actions")
            batch = db.batch()  # Start a new batch

    return actions_added, actions_already_present


if __name__ == "__main__":
    actions_added, actions_already_present = populate_actions()
    print(f"Actions already present: {actions_already_present}")
    print(f"Actions added: {actions_added}")
    print("Actions collection has been populated with chronologically sorted actions.")
