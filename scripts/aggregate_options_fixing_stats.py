import os
from collections import OrderedDict, defaultdict

import fix_amc_options as lib


def load_answers_data(filename: str = "all_answers_checked.txt") -> list[str]:
    """Load the answers data from a text file."""
    if not os.path.exists(filename):
        raise FileNotFoundError(f"Error: Answers file '{filename}' not found.")
    with open(filename, "r", encoding="utf-8") as f:
        lines = f.readlines()
    print(f"Loaded answers data from '{filename}'.")
    return [line.strip() for line in lines if line.strip()]


def identify_tests_from_answers(
    answers_lines: list[str],
) -> OrderedDict[tuple[str, str], None]:
    """Identify unique tests (year, AMC type) from the answers file, preserving order."""
    unique_tests = OrderedDict()
    for line in answers_lines:
        parts = line.split(",", 2)
        if len(parts) >= 3:
            _, problem_info, _ = parts
            problem_parts = problem_info.split()
            if len(problem_parts) >= 5:
                year = problem_parts[3]
                amc_type = problem_parts[4]
                unique_tests[(year, amc_type)] = None
    return unique_tests


def load_required_json_data(
    unique_tests: OrderedDict[tuple[str, str], None], cache_dir: str = "cache"
) -> OrderedDict[tuple[str, str], list[dict]]:
    """Load only the required JSON data files based on the identified tests."""
    json_data = OrderedDict()
    for year, amc_type in unique_tests:
        filename = f"{year}_{amc_type.replace('-', '_')}_Problems.json"
        file_path = os.path.join(cache_dir, filename)
        if os.path.exists(file_path):
            try:
                data = lib.load_json_data(file_path)
                json_data[(year, amc_type)] = data
                print(f"Loaded JSON data from '{filename}'.")
            except Exception as e:
                print(f"Error loading JSON file '{filename}': {e}")
        else:
            print(
                f"Warning: JSON file for test '{year} {amc_type}' not found in cache."
            )
    return json_data


def parse_all_data(
    json_data: OrderedDict[tuple[str, str], list[dict]], answers_lines: list[str]
) -> tuple[
    OrderedDict[tuple[str, str], dict[int, dict[str, str]]],
    OrderedDict[tuple[str, str], dict[int, dict[str, str]]],
]:
    """Parse all JSON data and Firestore answers."""
    all_correct_answers = OrderedDict()
    all_firestore_answers = OrderedDict()

    for (year, amc_type), test_data in json_data.items():
        correct_answers = lib.parse_json_data(test_data)
        all_correct_answers[(year, amc_type)] = correct_answers

        firestore_answers = lib.parse_answers_data(answers_lines, amc_type, year)
        all_firestore_answers[(year, amc_type)] = firestore_answers

    return all_correct_answers, all_firestore_answers


def compare_all_answers(
    correct: OrderedDict[tuple[str, str], dict[int, dict[str, str]]],
    firestore: OrderedDict[tuple[str, str], dict[int, dict[str, str]]],
) -> OrderedDict[tuple[str, str], dict[str, int]]:
    """Compare all correct answers with Firestore answers and return aggregated results."""
    aggregated_results = OrderedDict()

    for test_key in correct.keys():
        test_correct = correct[test_key]
        test_firestore = firestore.get(test_key, {})

        results = defaultdict(int)
        for problem_num in test_correct.keys():
            correct_options = test_correct[problem_num]
            firestore_options = test_firestore.get(problem_num, {})

            for option in ["A", "B", "C", "D", "E"]:
                correct_answer = correct_options.get(option, "NOT AVAILABLE")
                firestore_answer = firestore_options.get(option, "NOT AVAILABLE")

                if (
                    correct_answer == "NOT AVAILABLE"
                    and firestore_answer == "NOT AVAILABLE"
                ):
                    results["BOTH NOT AVAILABLE"] += 1
                elif (
                    correct_answer != "NOT AVAILABLE"
                    and firestore_answer == "NOT AVAILABLE"
                ):
                    results["MISSING IN FIRESTORE"] += 1
                elif (
                    correct_answer == "NOT AVAILABLE"
                    and firestore_answer != "NOT AVAILABLE"
                ):
                    results["EXTRA IN FIRESTORE"] += 1
                elif correct_answer == firestore_answer:
                    results["EXACT MATCH"] += 1
                elif lib.normalize_latex(correct_answer) == lib.normalize_latex(
                    firestore_answer
                ):
                    results["MATCH AFTER NORMALIZATION"] += 1
                else:
                    results["MISMATCH"] += 1

        aggregated_results[test_key] = dict(results)

    return aggregated_results


def display_aggregated_results(results: OrderedDict[tuple[str, str], dict[str, int]]):
    """Display the aggregated comparison results."""
    print("\n=== Aggregated Results ===\n")
    grand_total = defaultdict(int)

    for (year, amc_type), stats in results.items():
        print(f"\n{year} {amc_type}:")
        total = sum(stats.values())
        for status, count in stats.items():
            if count > 0:
                percentage = (count / total) * 100
                print(f"  {status}: {count} ({percentage:.2f}%)")
                grand_total[status] += count

    print("\nOverall Totals:")
    total = sum(grand_total.values())
    for status, count in sorted(grand_total.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / total) * 100
        print(f"  {status}: {count} ({percentage:.2f}%)")


def main():
    # Load answers data
    answers_lines = load_answers_data()

    # Identify tests from answers
    unique_tests = identify_tests_from_answers(answers_lines)

    # Load only the required JSON data
    json_data = load_required_json_data(unique_tests)

    # Parse all data
    all_correct_answers, all_firestore_answers = parse_all_data(
        json_data, answers_lines
    )

    # Compare all answers
    aggregated_results = compare_all_answers(all_correct_answers, all_firestore_answers)

    # Display aggregated results
    display_aggregated_results(aggregated_results)


if __name__ == "__main__":
    main()
