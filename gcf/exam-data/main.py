from flask import Request, Response, jsonify
from google.cloud import firestore_v1

db = firestore_v1.Client(database="grindolympiads")


def get_exam_data(request: Request) -> Response:
    headers = {"Access-Control-Allow-Origin": "*"}

    competition = request.args.get("competition")
    year = request.args.get("year")
    exam = request.args.get("exam")

    if not all([competition, year, exam]):
        return (
            jsonify({"error": "Missing parameters", "competition": competition}),
            400,
            headers,
        )

    try:
        # Fetch problems
        problems_ref = (
            db.collection(competition)
            .document(year)
            .collection(exam)
            .document("Problems")
            .collection("Problems")
        )
        problems = problems_ref.order_by("number").stream()
        problems_list = [{"problem_id": doc.id, **doc.to_dict()} for doc in problems]

        # Fetch comment
        test_comment_ref = (
            db.collection(competition)
            .document(year)
            .collection(exam)
            .document("Comment")
        )
        test_comment_doc = test_comment_ref.get()
        test_comment = (
            test_comment_doc.to_dict().get("comment", "")
            if test_comment_doc.exists
            else ""
        )

        # Prepare response
        response_data = {
            "problems": problems_list,
            "comment": test_comment,
            "competition": competition,
            "year": year,
            "exam": exam,
        }

        return jsonify(response_data), 200, headers

    except Exception as e:
        return jsonify({"error": str(e)}), 500, headers
