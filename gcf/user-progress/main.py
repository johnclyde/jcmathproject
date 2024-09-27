import jwt
from flask import Request, Response, jsonify
from google.cloud import firestore_v1

db = firestore_v1.Client(database="grindolympiads")
SECRET_KEY = (
    "a_secure_random_secret_key"  # Use the same secret key as in the login function
)


def user_progress(request: Request) -> Response:
    headers = {"Access-Control-Allow-Origin": "*"}

    # Verify JWT token
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return jsonify({"error": "Authorization header missing"}), 401, headers

    try:
        token = auth_header.split(" ")[1]
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = decoded_token["user_id"]
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 401, headers
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401, headers

    try:
        progress_ref = db.collection("users").document(user_id).collection("progress")
        progress_docs = progress_ref.stream()

        progress_data = []
        for doc in progress_docs:
            progress_item = doc.to_dict()
            progress_item["id"] = doc.id
            progress_data.append(progress_item)

        return jsonify(progress_data), 200, headers
    except Exception as e:
        return jsonify({"error": str(e)}), 500, headers
