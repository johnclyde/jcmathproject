import os

from colorama import Fore, Style, init

import fix_amc_options as lib

# Initialize colorama
init(autoreset=True)


def print_colored(text: str, color: str):
    """Prints colored text to the console."""
    color_dict = {
        "red": Fore.RED,
        "green": Fore.GREEN,
        "yellow": Fore.YELLOW,
        "cyan": Fore.CYAN,
        "magenta": Fore.MAGENTA,
        "blue": Fore.BLUE,
    }
    color_code = color_dict.get(color.lower(), Fore.WHITE)
    print(color_code + text + Style.RESET_ALL)


def get_user_selection(
    default_year: str = "2023", default_amc_type: str = "AMC-12B"
) -> tuple[str, str]:
    """Prompts the user to input the year and AMC type to investigate."""
    print("=== AMC Answers Comparison Tool ===\n")
    year = input(f"Enter the year to investigate [Default: {default_year}]: ").strip()
    if not year:
        year = default_year
    amc_type = input(
        f"Enter the AMC type to investigate (e.g., AMC-10A, AMC-12B) [Default: {default_amc_type}]: "
    ).strip()
    if not amc_type:
        amc_type = default_amc_type
    return year, amc_type.upper()


def load_answers_data(answers_file: str = "all_answers_checked.txt") -> list[str]:
    """
    Loads the answers data from a text file.
    """
    if not os.path.exists(answers_file):
        print_colored(f"Error: Answers file '{answers_file}' not found.", "red")
        exit(1)
    with open(answers_file, "r", encoding="utf-8") as f:
        lines = f.readlines()
        print_colored(f"Loaded answers data from '{answers_file}'.", "green")
        return [line.strip() for line in lines if line.strip()]


def compare_answers(
    correct: dict[int, dict[str, str]], firestore: dict[int, dict[str, str]]
) -> dict:
    """Compares the correct answers with Firestore answers and returns comparison results."""
    comparison_results = {}
    all_problem_numbers = sorted(set(correct.keys()).union(set(firestore.keys())))

    for problem_num in all_problem_numbers:
        comparison_results[problem_num] = {}
        correct_options = correct.get(problem_num, {})
        firestore_options = firestore.get(problem_num, {})

        for option in ["A", "B", "C", "D", "E"]:
            correct_answer = correct_options.get(option, "NOT AVAILABLE")
            firestore_answer = firestore_options.get(option, "NOT AVAILABLE")

            status = "BOTH NOT AVAILABLE"
            if (
                correct_answer != "NOT AVAILABLE"
                and firestore_answer != "NOT AVAILABLE"
            ):
                normalized_correct = lib.normalize_latex(correct_answer)
                normalized_firestore = lib.normalize_latex(firestore_answer)
                if correct_answer == firestore_answer:
                    status = "EXACT MATCH"
                elif normalized_correct == normalized_firestore:
                    status = "MATCH AFTER NORMALIZATION - NEEDS REVIEW"
                    if normalized_correct == lib.normalize_latex(
                        firestore_answer.lstrip("~")
                    ):
                        status += " (Matches after removing leading tilde)"
                else:
                    status = "MISMATCH - NEEDS REPLACEMENT"
            elif (
                correct_answer == "NOT AVAILABLE"
                and firestore_answer != "NOT AVAILABLE"
            ):
                status = "EXTRA IN FIRESTORE - NEEDS REMOVAL"
            elif (
                correct_answer != "NOT AVAILABLE"
                and firestore_answer == "NOT AVAILABLE"
            ):
                status = "MISSING IN FIRESTORE - NEEDS ADDITION"

            comparison_results[problem_num][option] = {
                "correct": correct_answer,
                "firestore": firestore_answer,
                "status": status,
            }

    return comparison_results


def dump_problem_details(
    details: dict,
):
    """Displays detailed information about a specific problem and option."""
    print("\n=== Detailed Information ===\n")
    print(f"Correct Answer: {details['correct_answer']}")
    print(f"Firestore Answer: {details['firestore_answer']}")
    print(f"Status: {details['status']}")

    if details["original_json"]:
        print("\nOriginal JSON data:")
        print(details["original_json"])
    else:
        print("\nOriginal JSON data not found for this problem.")


def display_comparison_results(results: dict):
    """Displays the comparison results to the user."""
    for problem_num, options in results.items():
        print(f"\nProblem #{problem_num}:")
        for option, data in options.items():
            print(f"  Option {option}:")
            print(f"    Correct Answer  : {data['correct']}")
            print(f"    Firestore Answer: {data['firestore']}")
            print(f"    Status: {data['status']}")


def interactive_menu(
    correct: dict[int, dict[str, str]],
    firestore: dict[int, dict[str, str]],
    json_data: list[dict],
):
    """Provides an interactive menu for the user to select a problem and option to investigate."""
    while True:
        print("\n=== Interactive Menu ===")
        print("1. Dump details for a specific problem and option")
        print("2. Exit")

        choice = input("Enter your choice (1 or 2): ").strip()

        if choice == "1":
            problem_num = input("Enter the problem number: ").strip()
            option = input("Enter the option (A, B, C, D, or E): ").strip().upper()

            try:
                problem_num = int(problem_num)
                if option not in ["A", "B", "C", "D", "E"]:
                    raise ValueError("Invalid option")

                details = lib.get_problem_details(
                    problem_num, option, correct, firestore, json_data
                )
                dump_problem_details(details)
            except ValueError:
                print("Invalid input. Please enter a valid problem number and option.")
        elif choice == "2":
            print("Exiting interactive menu.")
            break
        else:
            print("Invalid choice. Please enter 1 or 2.")


def main():
    # Step 1: User Selection
    year, amc_type = get_user_selection()

    # Step 2: Load JSON Data
    json_filename = f"cache/{year}_{amc_type}_Problems.json".replace("-", "_")
    json_data = lib.load_json_data(json_filename)

    # Step 3: Load Answers Data
    answers_lines = load_answers_data("all_answers_checked.txt")

    # Step 4: Parse JSON Data
    correct_answers = lib.parse_json_data(json_data)

    # Step 5: Parse Answers Data
    firestore_answers = lib.parse_answers_data(answers_lines, amc_type, year)

    # Step 6: Compare Answers
    comparison_results = compare_answers(correct_answers, firestore_answers)

    # Step 7: Display Comparison Results
    display_comparison_results(comparison_results)

    # Step 8: Interactive Menu
    interactive_menu(correct_answers, firestore_answers, json_data)


if __name__ == "__main__":
    main()
