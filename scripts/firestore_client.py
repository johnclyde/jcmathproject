import json

from google.cloud.firestore_v1 import SERVER_TIMESTAMP, Client


def initialize_firestore() -> tuple[Client, str]:
    """Initialize Firestore client."""
    try:
        with open("mykeyfile.json", "r") as keyfile:
            key_dict = json.load(keyfile)
            project_id = key_dict["project_id"]
    except FileNotFoundError:
        raise FileNotFoundError("'mykeyfile.json' not found.")
    except KeyError:
        raise KeyError("'project_id' not found in 'mykeyfile.json'.")

    return (
        Client(project=project_id, database="grindolympiads"),
        project_id,
    )


def update_problem_image(
    db: Client,
    problem_id: str,
    asy_content: str,
    width: int,
    height: int,
    url: str,
) -> str:
    """Update the problem image in Firestore and create an audit entry."""
    problem_ref = db.collection("problems").document(problem_id)
    audit_ref = db.collection("problemAudit").document()

    # Ensure the URL is properly formatted
    if url.startswith("//"):
        full_url = f"https:{url}"
    elif url and not url.startswith("http"):
        full_url = f"https://{url}"
    else:
        full_url = url

    # Update problem image
    problem_ref.update(
        {
            "details.image": {
                "alt": f"[asy]{asy_content}[/asy]",
                "url": full_url,
                "width": width,
                "height": height,
            }
        }
    )

    # Create audit entry
    audit_data = {
        "problemId": problem_id,
        "editedBy": "ASY_update_script",
        "editedAt": SERVER_TIMESTAMP,
        "previousVersion": {"details": {"image": None}},  # Adjust as needed
        "newVersion": {
            "details": {
                "image": {
                    "alt": f"[asy]{asy_content}[/asy]",
                    "url": full_url,
                    "width": width,
                    "height": height,
                }
            }
        },
    }
    audit_ref.set(audit_data)

    return audit_ref.id


def get_firestore_link(project_id: str, collection: str, doc_id: str) -> str:
    """Generate a link to the Firestore document in the Firebase console."""
    return f"https://console.firebase.google.com/u/1/project/{project_id}/firestore/data/~2F{collection}~2F{doc_id}"
