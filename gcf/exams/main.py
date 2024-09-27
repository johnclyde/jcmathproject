from flask import Request, Response, jsonify
from google.cloud import firestore_v1

db = firestore_v1.Client(database="grindolympiads")


def list_exams(request: Request) -> Response:
    headers = {"Access-Control-Allow-Origin": "*"}

    try:
        competitions = db.collections()
        tests = []
        for competition in competitions:
            competition_name = competition.id
            years = competition.list_documents()
            for year in years:
                year_name = year.id
                exams = year.collections()
                for exam in exams:
                    exam_name = exam.id
                    exam_doc = exam.document("Info").get()
                    if not exam_doc.exists or not exam_doc.to_dict().get(
                        "private", False
                    ):
                        tests.append(
                            {
                                "competition": competition_name,
                                "year": year_name,
                                "exam": exam_name,
                            }
                        )

        response_data = {"tests": tests}
        return jsonify(response_data), 200, headers

    except Exception as e:
        return jsonify({"error": str(e)}), 500, headers
