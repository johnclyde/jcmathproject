import jwt
from flask import Request, Response, jsonify
from google.cloud import firestore_v1

db = firestore_v1.Client(database="grindolympiads")
SECRET_KEY = (
    "a_secure_random_secret_key"  # Use the same secret key as in the login function
)


def mark_notification_read(request: Request) -> Response:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
    }
    if request.method == "OPTIONS":
        return Response(status=204, headers=headers)

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
        request_json = request.get_json()
        notification_id = request_json.get("notification_id")

        if not notification_id:
            return jsonify({"error": "Notification ID is required"}), 400, headers

        # Update the notification for the authenticated user
        notification_ref = (
            db.collection("users")
            .document(user_id)
            .collection("notifications")
            .document(notification_id)
        )
        notification_ref.update({"read": True})

        return jsonify({"message": "Notification marked as read"}), 200, headers
    except Exception as e:
        return jsonify({"error": str(e)}), 500, headers
