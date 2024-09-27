import jwt
from flask import Request, Response, jsonify
from google.cloud import firestore_v1

db = firestore_v1.Client(database="grindolympiads")
SECRET_KEY = (
    "a_secure_random_secret_key"  # Use the same secret key as in the login function
)


def logout(request: Request) -> Response:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
    }
    if request.method == "OPTIONS":
        return Response(status=204, headers=headers)

    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Authorization header missing"}), 401, headers

        token = auth_header.split(" ")[1]
        try:
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

            # Invalidate the token by storing it in Firestore
            blacklist_ref = db.collection("token_blacklist").document(token)
            blacklist_ref.set(
                {
                    "token": token,
                    "user_id": decoded_token["user_id"],
                    "exp": decoded_token["exp"],
                }
            )

            return jsonify({"message": "Logout successful"}), 200, headers
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401, headers
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401, headers

    except Exception as e:
        return jsonify({"error": str(e)}), 500, headers
