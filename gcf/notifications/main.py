import jwt
from flask import Request, Response, jsonify
from google.cloud import firestore_v1

db = firestore_v1.Client(database="grindolympiads")
SECRET_KEY = (
    "a_secure_random_secret_key"  # Use the same secret key as in the login function
)


def user_notifications(request: Request) -> Response:
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
        # Fetch notifications for the authenticated user
        notifications_ref = (
            db.collection("users").document(user_id).collection("notifications")
        )
        notifications = (
            notifications_ref.order_by(
                "timestamp", direction=firestore_v1.Query.DESCENDING
            )
            .limit(10)
            .stream()
        )

        notifications_list = []
        for notification in notifications:
            notification_data = notification.to_dict()
            notification_data["id"] = notification.id
            notifications_list.append(notification_data)

        return jsonify(notifications_list), 200, headers
    except Exception as e:
        return jsonify({"error": str(e)}), 500, headers
