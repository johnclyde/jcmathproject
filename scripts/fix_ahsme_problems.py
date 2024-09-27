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
exams_ref = db.collection("exams")
problems_ref = db.collection("problems")


def preload_problems() -> dict:
    problems = list(problems_ref.get())
    problem_details = {}

    for problem in problems:
        problem_id = problem.id
        problem_data = problem.to_dict()
        statement = problem_data.get("details", {}).get("statement", "")
        exam_refs = problem_data.get("examRefs", {})
        problem_details[problem_id] = {"statement": statement, "examRefs": exam_refs}

    return problem_details


def backfill_problems(exam_id: str, problem_count: int, year: str):
    for i in range(problem_count + 1, 31):
        problem_number = str(i)
        new_problem_ref = problems_ref.document()
        new_problem_data = {
            "knownAs": f"#{problem_number} on the {year} AHSME",
            "details": {"statement": "placeholder string"},
            "examRefs": {exam_id: problem_number},
        }

        # Create new problem
        new_problem_ref.set(new_problem_data)

        # Append to the exam's problems list
        exams_ref.document(exam_id).update(
            {
                "problems": firestore_v1.ArrayUnion(
                    [{"label": problem_number, "problemId": new_problem_ref.id}]
                )
            }
        )

        print(f"Created problem {problem_number} for exam {exam_id}")


def list_all_exams(problem_details: dict):
    exams = list(exams_ref.get())

    print("\n=== List of All Exams ===")
    if not exams:
        print("No exams found.")
        return

    # Extract exam data with sorting by 'name' and 'year'
    exam_data_list = []
    for exam in exams:
        exam_id = exam.id
        exam_data = exam.to_dict()
        exam_name = exam_data.get("name", "Unnamed Exam")
        exam_year = exam_data.get("year", "Unknown Year")
        problems = exam_data.get("problems", [])
        problem_count = len(problems)
        exam_data_list.append(
            {
                "exam_id": exam_id,
                "exam_name": exam_name,
                "exam_year": exam_year,
                "problem_count": problem_count,
                "problems": problems,
            }
        )

    # Sort the list by 'name' and 'year'
    sorted_exam_data_list = sorted(
        exam_data_list, key=lambda x: (x["exam_name"], x["exam_year"])
    )

    print(f"{'Exam ID':<30} {'Exam Name':<50} {'Year':<10} {'Problem Count':<15}")
    print("=" * 135)

    for exam in sorted_exam_data_list:
        print(
            f"{exam['exam_id']:<30} {exam['exam_name']:<50} {exam['exam_year']:<10} {exam['problem_count']:<15}"
        )

        # Check if exam name contains "AHSME" and problem count is less than 30
        if "AHSME" in exam["exam_name"] and exam["problem_count"] < 30:
            print(f"Backfill {exam['exam_name']} up to 30 problems.")
            backfill_problems(exam["exam_id"], exam["problem_count"], exam["exam_year"])
            print("Backfilling complete for that one.")

        # Dump label, problem ID, first 30 characters of detail statement, and add an asterisk next to the label if it matches the current exam
        for problem in exam["problems"]:
            problem_label = problem.get("label", "Unknown Label")
            problem_id = problem.get("problemId", "Unknown Problem ID")
            detail_statement = problem_details.get(problem_id, {}).get("statement", "")
            exam_refs = problem_details.get(problem_id, {}).get("examRefs", {})
            asterisk = "*" if exam["exam_id"] in exam_refs else ""
            print(
                f"    - Label: {problem_label}{asterisk:<1}  Problem ID: {problem_id:<30} Detail: {detail_statement[:30]}"
            )


def main():
    print("\n=== Exam Listing Script ===")
    try:
        # Preload problem details
        problem_details = preload_problems()

        # List all exams with problem details
        list_all_exams(problem_details)
        print("\n=== Listing Complete ===")
    except Exception as e:
        print(f"\n=== Error ===\nAn error occurred while listing exams: {str(e)}")


if __name__ == "__main__":
    main()
