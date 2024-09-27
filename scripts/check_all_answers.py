import re

from firestore_client import initialize_firestore

# Define the priority for exam types
EXAM_PRIORITY = {"AMC-10": 1, "AMC-12": 2}

# Define the priority for sections
SECTION_PRIORITY = {"A": 1, "B": 2}


def parse_known_as(known_as):
    """
    Parses the 'knownAs' string to extract year, exam type, section, and problem number.
    Example input: "#25 on the 2023 AMC-10A"
    Returns: (year, exam_type, section, problem_number)
    """
    pattern = r"#(\d+)\s+on\s+the\s+(\d{4})\s+(AMC-\d+)([A-Z])"
    match = re.match(pattern, known_as, re.IGNORECASE)
    if match:
        problem_number = int(match.group(1))
        year = int(match.group(2))
        exam_type = match.group(3).upper()  # e.g., AMC-10
        section = match.group(4).upper()  # e.g., A
        return (year, exam_type, section, problem_number)
    else:
        # Handle unexpected formats
        return (0, "AMC-0", "Z", 0)  # Assign default values for sorting at the end


def sorting_key(p):
    year, exam_type, section, problem_number = parse_known_as(p["knownAs"])
    exam_priority = EXAM_PRIORITY.get(
        exam_type, 99
    )  # Unknown types get lowest priority
    section_priority = SECTION_PRIORITY.get(
        section, 99
    )  # Unknown sections get lowest priority
    return (year, exam_priority, section_priority, problem_number)


def fetch_amc_problems(db):
    problems = db.collection("problems").stream()
    amc_problems = []
    for problem in problems:
        data = problem.to_dict()
        if (
            data.get("details", {}).get("type") == "multiple_choice"
            and "knownAs" in data
        ):
            known_as_lower = data["knownAs"].lower()
            if "amc-10" in known_as_lower or "amc-12" in known_as_lower:
                amc_problems.append(
                    {
                        "id": problem.id,
                        "knownAs": data["knownAs"],
                        "options": data.get("details", {}).get("options", {}),
                        "correctAnswer": data.get("details", {}).get(
                            "correctAnswer", ""
                        ),
                    }
                )
    return amc_problems


def fetch_answered_problems(db):
    actions = db.collection("actions").stream()
    answered_problems = set()
    for action in actions:
        data = action.to_dict()
        if data.get("type") == "submitAnswer" and data.get("problemId"):
            answered_problems.add(data["problemId"])
    return answered_problems


def main():
    db, _ = initialize_firestore()
    amc_problems = fetch_amc_problems(db)
    answered_problems = fetch_answered_problems(db)

    # Sort problems using the enhanced sorting key
    amc_problems.sort(key=sorting_key)

    for problem in amc_problems:
        asterisk = "*" if problem["id"] in answered_problems else ""
        # Sort the options by key (A, B, C, D, E)
        for option in sorted(problem["options"]):
            answer = problem["options"][option]
            print(f"{problem['id']}, {problem['knownAs']} {option}: {answer}{asterisk}")
        print()  # Empty line between problems for readability


if __name__ == "__main__":
    main()
