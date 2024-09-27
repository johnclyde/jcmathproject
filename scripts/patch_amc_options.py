import json
import os
import signal
import sys
from typing import Any

from rich.console import Console
from rich.prompt import Prompt

import fix_amc_options as lib
from firestore_client import (
    SERVER_TIMESTAMP,
    Client,
    get_firestore_link,
    initialize_firestore,
)
from fix_amc_options_interactive import compare_answers
from json_file_parsing import generate_known_as, parse_known_as

console = Console()

# Global variables
latest_dumped_file = None
default_choice = None


def signal_handler(sig, frame):
    if latest_dumped_file:
        console.print(
            f"\n[yellow]Script interrupted. Latest dumped file: {latest_dumped_file}[/yellow]"
        )
    else:
        console.print("\n[yellow]Script interrupted. No files were dumped.[/yellow]")
    sys.exit(0)


signal.signal(signal.SIGINT, signal_handler)


def fetch_problem_audits(db):
    """Fetch all problem audit entries from Firestore."""
    audits = db.collection("problemAudit").stream()
    return [(audit.id, audit.to_dict()) for audit in audits]


def format_diff(key: str, prev_value: Any, new_value: Any, indent: str = "") -> str:
    """Format the difference between two values."""
    if isinstance(prev_value, dict) and isinstance(new_value, dict):
        diff = f"{indent}{key}:\n"
        all_keys = set(prev_value.keys()) | set(new_value.keys())
        for sub_key in all_keys:
            if sub_key not in prev_value:
                diff += f"{indent}  + {sub_key}: {new_value[sub_key]}\n"
            elif sub_key not in new_value:
                diff += f"{indent}  - {sub_key}: {prev_value[sub_key]}\n"
            elif prev_value[sub_key] != new_value[sub_key]:
                diff += format_diff(
                    sub_key, prev_value[sub_key], new_value[sub_key], indent + "  "
                )
        return diff
    else:
        return f"{indent}{key}: {prev_value} -> {new_value}\n"


def format_audit_entry(project_id: str, audit_id: str, audit: dict[str, Any]) -> str:
    """Format a single audit entry for display."""
    formatted = (
        f"Audit Entry: {get_firestore_link(project_id, 'problemAudit', audit_id)}\n"
    )
    formatted += f"Problem ID: {audit.get('problemId', 'N/A')} - {get_firestore_link(project_id, 'problems', audit.get('problemId', ''))}\n"
    formatted += f"Exam ID: {audit.get('examId', 'N/A')} - {get_firestore_link(project_id, 'exams', audit.get('examId', ''))}\n"
    formatted += f"Edited by: {audit.get('editedBy', 'N/A')}\n"
    formatted += f"Edited at: {audit.get('editedAt', 'N/A')}\n"

    prev = audit.get("previousVersion")
    new = audit.get("newVersion")

    if isinstance(prev, dict) and isinstance(new, dict):
        formatted += "Changes:\n"
        all_keys = set(prev.keys()) | set(new.keys())
        for key in all_keys:
            if key not in prev:
                formatted += f"  + {key}: {new[key]}\n"
            elif key not in new:
                formatted += f"  - {key}: {prev[key]}\n"
            elif prev[key] != new[key]:
                formatted += format_diff(key, prev[key], new[key], "  ")
    else:
        formatted += "No valid change details available.\n"
        if prev is not None:
            formatted += f"Previous version: {prev}\n"
        if new is not None:
            formatted += f"New version: {new}\n"

    return formatted


def load_answers_data(answers_file: str = "all_answers_checked.txt") -> list:
    """Load the answers data from a text file."""
    if not os.path.exists(answers_file):
        console.print(f"[red]Error: Answers file '{answers_file}' not found.[/red]")
        exit(1)
    with open(answers_file, "r", encoding="utf-8") as f:
        lines = f.readlines()
        console.print(f"[green]Loaded answers data from '{answers_file}'.[/green]")
        return [line.strip() for line in lines if line.strip()]


def get_available_tests(answers_lines: list) -> dict[tuple[str, str], None]:
    """Identify unique tests (year, AMC type) from the answers file."""
    unique_tests = {}
    for line in answers_lines:
        parts = line.split(",", 2)
        if len(parts) >= 3:
            _, problem_info, _ = parts
            year, exam_type, _, _ = parse_known_as(problem_info.strip())
            if year and exam_type:
                unique_tests[(str(year), exam_type)] = None
    return unique_tests


def get_problem_id_map(db: Client) -> dict[str, str]:
    """Fetch a mapping from knownAs to problem IDs."""
    problems_ref = db.collection("problems")
    problems = problems_ref.stream()
    problem_id_map = {}
    for problem in problems:
        data = problem.to_dict()
        known_as = data.get("knownAs", "")
        if known_as:
            problem_id_map[known_as] = problem.id
    return problem_id_map


def prompt_user(
    problem_num: int,
    year: str,
    amc_type: str,
    firestore_link: str,
    discrepancies: dict[str, Any],
    json_filename: str,
    answers_file: str,
    json_data: list,
    correct_answers: dict,
    firestore_answers: dict,
) -> bool:
    """Prompt the user whether to update the problem options in Firestore."""
    global default_choice
    console.print(
        f"\n[bold]Problem #{problem_num} in {year} {amc_type} needs updating.[/bold]"
    )
    console.print(f"Firestore link: [blue]{firestore_link}[/blue]\n")

    # Display discrepancies
    console.print("[yellow]Discrepancies:[/yellow]")
    for option_letter, data in discrepancies.items():
        status = data["status"]
        console.print(f"Option {option_letter}: [red]{status}[/red]")
        console.print(f"  Correct Answer  : {data['correct']}")
        console.print(f"  Firestore Answer: {data['firestore']}\n")

    while True:
        prompt = (
            "Do you want to update this problem's options in Firestore? (y/n/debug)"
        )
        if default_choice:
            prompt += f" [{default_choice}]"
        choice = Prompt.ask(prompt).strip()

        if choice == "":
            choice = default_choice

        if choice.lower() in ["y", "yes"]:
            default_choice = "Y" if choice == "Y" else None
            return True
        elif choice.lower() in ["n", "no"]:
            default_choice = "N" if choice == "N" else None
            print(f"Setting {default_choice=}")
            return False
        elif choice.lower() in ["d", "debug"]:
            console.print("[cyan]Debug Information:[/cyan]")
            console.print(f"JSON data source: {json_filename}")
            console.print(f"Firestore data source: {answers_file}")
            console.print(f"Problem number: {problem_num}")
            console.print(f"Year: {year}")
            console.print(f"AMC Type: {amc_type}")
            console.print("\nRaw JSON data:")
            problem_data = next(
                (p for p in json_data if p["number"] == problem_num), None
            )
            console.print(json.dumps(problem_data, indent=2))
            console.print("\nParsed correct answers:")
            console.print(json.dumps(correct_answers.get(problem_num, {}), indent=2))
            console.print("\nParsed Firestore answers:")
            console.print(json.dumps(firestore_answers.get(problem_num, {}), indent=2))
        else:
            console.print(
                "[red]Invalid input. Please enter 'y', 'n', or 'debug'.[/red]"
            )


def update_problem_options(
    db: Client,
    project_id: str,
    problem_id: str,
    new_options: dict[str, str],
    edited_by: str = "admin_script",
):
    """Update the problem options in Firestore and add an entry to problemAudit."""
    problem_ref = db.collection("problems").document(problem_id)
    audit_ref = db.collection("problemAudit").document()

    # Fetch current problem data
    problem = problem_ref.get()
    if not problem.exists:
        console.print(
            f"[red]Problem ID {problem_id} does not exist in Firestore.[/red]"
        )
        return

    problem_data = problem.to_dict()
    previous_version = problem_data.get("details", {}).get("options", {})
    new_version = new_options

    # Update problem options
    problem_ref.update({"details.options": new_options})

    # Add entry to problemAudit
    audit_data = {
        "problemId": problem_id,
        "editedBy": edited_by,
        "editedAt": SERVER_TIMESTAMP,
        "previousVersion": {"details": {"options": previous_version}},
        "newVersion": {"details": {"options": new_version}},
    }
    audit_ref.set(audit_data)

    console.print("[green]Problem options updated and audit entry created.[/green]")

    # Generate the Firestore link for the new audit entry
    return get_firestore_link(project_id, "problemAudit", audit_ref.id)


def dump_updated_answers(
    answers_lines: list, problem_id: str, new_options: dict[str, str]
) -> str:
    """Dump updated answers to a new file."""
    new_filename = "all_answers_checked_temp.txt"

    updated_lines = []
    for line in answers_lines:
        parts = line.split(",", 2)
        if len(parts) == 3 and parts[0].strip() == problem_id:
            problem_info = parts[1].strip()
            option = problem_info.split()[-1]
            if option in new_options:
                updated_line = f"{problem_id}, {problem_info}: {new_options[option]}"
                updated_lines.append(updated_line)
            else:
                updated_lines.append(line)
        else:
            updated_lines.append(line)

    with open(new_filename, "w", encoding="utf-8") as f:
        f.write("\n".join(updated_lines))

    console.print(f"[green]Updated answers dumped to: {new_filename}[/green]")
    return new_filename


def process_discrepancies(db: Client, project_id: str):
    """Process discrepancies and update Firestore if necessary."""
    global latest_dumped_file
    answers_file = "all_answers_checked.txt"
    answers_lines = load_answers_data(answers_file)
    unique_tests = get_available_tests(answers_lines)
    problem_id_map = get_problem_id_map(db)

    for year, amc_type in unique_tests.keys():
        console.print(f"\n[bold]Processing {year} {amc_type}...[/bold]")
        json_filename = f"cache/{year}_{amc_type}_Problems.json".replace("-", "_")
        if not os.path.exists(json_filename):
            console.print(f"[red]JSON file '{json_filename}' not found.[/red]")
            continue

        json_data = lib.load_json_data(json_filename)

        # Parse JSON Data
        correct_answers = lib.parse_json_data(json_data)

        # Parse Firestore Answers
        firestore_answers = lib.parse_answers_data(answers_lines, amc_type, year)

        # Compare Answers
        comparison_results = compare_answers(correct_answers, firestore_answers)

        # For each problem that needs updating
        for problem_num, options in comparison_results.items():
            needs_update = False
            discrepancies = {}
            for option_letter, option_data in options.items():
                if "NEEDS" in option_data["status"]:
                    needs_update = True
                    discrepancies[option_letter] = option_data

            if needs_update:
                # Build the new options dict
                new_options = {}
                for option_letter in ["A", "B", "C", "D", "E"]:
                    answer = correct_answers.get(problem_num, {}).get(option_letter, "")
                    if answer:
                        new_options[option_letter] = answer

                # Get problem identifier
                known_as = generate_known_as(problem_num, year, amc_type)
                problem_id = problem_id_map.get(known_as)

                if not problem_id:
                    console.print(
                        f"[red]Problem '{known_as}' not found in Firestore.[/red]"
                    )
                    continue

                firestore_link = get_firestore_link(project_id, "problems", problem_id)
                should_update = prompt_user(
                    problem_num,
                    year,
                    amc_type,
                    firestore_link,
                    discrepancies,
                    json_filename,
                    answers_file,
                    json_data,
                    correct_answers,
                    firestore_answers,
                )

                if should_update:
                    audit_link = update_problem_options(
                        db, project_id, problem_id, new_options
                    )
                    console.print(
                        f"Audit entry created. View it here: [blue]{audit_link}[/blue]"
                    )
                    latest_dumped_file = dump_updated_answers(
                        answers_lines, problem_id, new_options
                    )
                else:
                    console.print(
                        f"[yellow]Skipped updating Problem #{problem_num}.[/yellow]"
                    )
            else:
                console.print(
                    f"Problem #{problem_num} options are correct. No update needed."
                )

    console.print("\n[green]All discrepancies processed.[/green]")
    if latest_dumped_file:
        console.print(
            f"[green]Final updated answers file: {latest_dumped_file}[/green]"
        )


def main():
    db, project_id = initialize_firestore()
    audits = fetch_problem_audits(db)

    print(f"Total problem audit entries: {len(audits)}\n")

    for i, (audit_id, audit) in enumerate(audits, 1):
        print(f"Audit Entry #{i}")
        print(format_audit_entry(project_id, audit_id, audit))
        print("-" * 50)

    # Continue to process discrepancies
    process_discrepancies(db, project_id)


if __name__ == "__main__":
    main()
