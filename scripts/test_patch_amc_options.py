import json
from unittest.mock import MagicMock, patch

from fix_amc_options import load_json_data
from patch_amc_options import (
    format_audit_entry,
    format_diff,
    get_firestore_link,
    process_discrepancies,
    prompt_user,
    update_problem_options,
)


def test_get_firestore_link():
    """Test the Firestore link generation."""
    project_id = "test_project"
    collection = "problems"
    doc_id = "ABC123"
    expected_link = "https://console.firebase.google.com/project/test_project/firestore/data/~2Fproblems~2FABC123"
    assert get_firestore_link(project_id, collection, doc_id) == expected_link


def test_format_diff_simple():
    """Test format_diff with simple key-value differences."""
    prev = {"A": "old1", "B": "old2"}
    new = {"A": "new1", "B": "old2"}
    assert format_diff("Options", prev, new) == "Options:\n  A: old1 -> new1\n"


def test_load_json_data_existing_file(tmp_path):
    """Test loading JSON data when the file exists."""
    year = "2000"
    amc_type = "AMC-10A"
    json_content = json.dumps(
        [
            {"number": 1, "content": "Problem 1", "options": "<p>Options here</p>"},
        ]
    )
    json_filename = tmp_path / "cache" / "2000_AMC_10A_Problems.json"
    json_filename.parent.mkdir(parents=True)
    json_filename.write_text(json_content)

    with patch("patch_amc_options.os.path.exists", return_value=True):
        with patch(
            "fix_amc_options.load_json_data",
            return_value=[
                {"number": 1, "content": "Problem 1", "options": "<p>Options here</p>"}
            ],
        ):
            data = load_json_data(year, amc_type)
            assert data == [
                {"number": 1, "content": "Problem 1", "options": "<p>Options here</p>"}
            ]


def test_load_json_data_non_existing_file(tmp_path):
    """Test loading JSON data when the file does not exist, including trying alternate naming."""
    year = "2000"
    amc_type = "AMC-10A"
    # Assume that both the primary and alternate JSON files do not exist
    with patch("fix_amc_options.os.path.exists", return_value=False):
        data = load_json_data(year, amc_type)
        assert data == []


@patch("patch_amc_options.Prompt.ask")
def test_prompt_user(mock_prompt):
    """Test prompting the user for updating Firestore."""
    # Simulate user input 'yes'
    mock_prompt.return_value = "yes"
    result = prompt_user(
        1,
        "2000",
        "AMC-10A",
        "http://fake-link.com",
        {"A": {"status": "MISMATCH", "correct": "23", "firestore": "20"}},
    )
    assert result is True

    # Simulate user input 'no'
    mock_prompt.return_value = "no"
    result = prompt_user(
        1,
        "2000",
        "AMC-10A",
        "http://fake-link.com",
        {"A": {"status": "MISMATCH", "correct": "23", "firestore": "20"}},
    )
    assert result is False

    # Simulate invalid input followed by 'y'
    mock_prompt.side_effect = ["maybe", "y"]
    result = prompt_user(
        1,
        "2000",
        "AMC-10A",
        "http://fake-link.com",
        {"A": {"status": "MISMATCH", "correct": "23", "firestore": "20"}},
    )
    assert result is True


def test_format_audit_entry_no_changes():
    """Test formatting an audit entry with no changes."""
    project_id = "test_project"
    audit_id = "AUDIT123"
    audit = {
        "problemId": "PROB123",
        "examId": "EXAM456",
        "editedBy": "admin",
        "editedAt": "2023-10-01T12:34:56Z",
        "previousVersion": None,
        "newVersion": None,
    }
    expected_output = (
        "Audit Entry: https://console.firebase.google.com/project/test_project/firestore/data/~2FproblemAudit~2FAUDIT123\n"
        "Problem ID: PROB123 - https://console.firebase.google.com/project/test_project/firestore/data/~2Fproblems~2FPROB123\n"
        "Exam ID: EXAM456 - https://console.firebase.google.com/project/test_project/firestore/data/~2Fexams~2FEXAM456\n"
        "Edited by: admin\n"
        "Edited at: 2023-10-01T12:34:56Z\n"
        "No valid change details available.\n"
    )
    assert format_audit_entry(project_id, audit_id, audit) == expected_output


@patch("patch_amc_options.firestore_v1.Client")
def test_update_problem_options(mock_firestore_client, mocker):
    """Test updating problem options and adding an audit entry in Firestore."""
    # Mock Firestore document references and methods
    mock_db = MagicMock()
    mock_firestore_client.return_value = mock_db
    mock_problem_ref = MagicMock()
    mock_audit_ref = MagicMock()
    mock_db.collection.return_value.document.side_effect = [
        mock_problem_ref,
        mock_audit_ref,
    ]

    # Mock existing problem data
    mock_problem_ref.get.return_value.exists = True
    mock_problem_ref.get.return_value.to_dict.return_value = {
        "details": {
            "options": {
                "A": "old1",
                "B": "old2",
            }
        }
    }

    # Define new options
    new_options = {
        "A": "new1",
        "B": "new2",
        "C": "new3",
        "D": "new4",
        "E": "new5",
    }

    # Call the function
    update_problem_options(mock_db, "PROB123", new_options, edited_by="tester")

    # Assertions
    mock_problem_ref.update.assert_called_once_with({"details.options": new_options})
    mock_audit_ref.set.assert_called_once()
    audit_call_args = mock_audit_ref.set.call_args[0][0]
    assert audit_call_args["problemId"] == "PROB123"
    assert audit_call_args["editedBy"] == "tester"
    assert audit_call_args["previousVersion"] == {
        "details": {"options": {"A": "old1", "B": "old2"}}
    }
    assert audit_call_args["newVersion"] == {"details": {"options": new_options}}
    assert "editedAt" in audit_call_args


def test_process_discrepancies_no_discrepancies(mocker):
    """Test process_discrepancies when there are no discrepancies."""
    # Mock Firestore
    mock_db = MagicMock()
    project_id = "test_project"

    # Mock loaded answers
    answers_lines = [
        "ID123, #1 on the 2000 AMC-10A A: 23",
        "ID124, #1 on the 2000 AMC-10A B: 55",
    ]

    with patch("patch_amc_options.load_answers_data", return_value=answers_lines):
        with patch(
            "patch_amc_options.get_available_tests",
            return_value={("2000", "AMC-10A"): None},
        ):
            with patch(
                "fix_amc_options.load_json_data",
                return_value={1: {"A": "23", "B": "55"}}.items(),
            ):
                with patch(
                    "fix_amc_options.parse_json_data",
                    return_value={1: {"A": "23", "B": "55"}},
                ):
                    with patch(
                        "fix_amc_options.parse_answers_data",
                        return_value={1: {"A": "23", "B": "55"}},
                    ):
                        with patch(
                            "patch_amc_options.compare_answers",
                            return_value={
                                1: {
                                    "A": {
                                        "correct": "23",
                                        "firestore": "23",
                                        "status": "EXACT MATCH",
                                    },
                                    "B": {
                                        "correct": "55",
                                        "firestore": "55",
                                        "status": "EXACT MATCH",
                                    },
                                }
                            },
                        ):
                            with patch("patch_amc_options.console.print") as mock_print:
                                process_discrepancies(mock_db, project_id)
                                # Check that it printed no updates needed
                                mock_print.assert_any_call(
                                    "Problem #1 options are correct. No update needed."
                                )


def test_process_discrepancies_with_discrepancies(mocker):
    """Test process_discrepancies when there are discrepancies."""
    # Mock Firestore
    mock_db = MagicMock()
    project_id = "test_project"

    # Mock loaded answers
    answers_lines = [
        "ID123, #1 on the 2000 AMC-10A A: 23",
        "ID124, #1 on the 2000 AMC-10A B: 55",
        "ID125, #1 on the 2000 AMC-10A C: 99",
    ]

    # Mock problem_id_map
    problem_id_map = {
        "#1 on the 2000 AMC-10A": "PROB123",
    }

    with patch("patch_amc_options.load_answers_data", return_value=answers_lines):
        with patch(
            "patch_amc_options.get_available_tests",
            return_value={("2000", "AMC-10A"): None},
        ):
            with patch(
                "fix_amc_options.load_json_data",
                return_value=[
                    {
                        "number": 1,
                        "content": "Problem 1",
                        "options": "<p>Options here</p>",
                    },
                ],
            ):
                with patch(
                    "fix_amc_options.parse_json_data",
                    return_value={1: {"A": "23", "B": "55", "C": "99"}},
                ):
                    with patch(
                        "fix_amc_options.parse_answers_data",
                        return_value={1: {"A": "20", "B": "50", "C": "90"}},
                    ):
                        with patch(
                            "patch_amc_options.compare_answers",
                            return_value={
                                1: {
                                    "A": {
                                        "correct": "23",
                                        "firestore": "20",
                                        "status": "MISMATCH - NEEDS REPLACEMENT",
                                    },
                                    "B": {
                                        "correct": "55",
                                        "firestore": "50",
                                        "status": "MISMATCH - NEEDS REPLACEMENT",
                                    },
                                    "C": {
                                        "correct": "99",
                                        "firestore": "90",
                                        "status": "MISMATCH - NEEDS REPLACEMENT",
                                    },
                                }
                            },
                        ):
                            with patch(
                                "patch_amc_options.get_problem_id_map",
                                return_value=problem_id_map,
                            ):
                                with patch(
                                    "patch_amc_options.prompt_user", return_value=True
                                ):
                                    with patch(
                                        "patch_amc_options.update_problem_options"
                                    ) as mock_update:
                                        with patch(
                                            "patch_amc_options.console.print"
                                        ) as mock_print:
                                            process_discrepancies(mock_db, project_id)
                                            # Check that update_problem_options was called
                                            mock_update.assert_called_once_with(
                                                mock_db,
                                                "PROB123",
                                                {"A": "23", "B": "55", "C": "99"},
                                            )
                                            # Check that it printed the discrepancy and update message
                                            mock_print.assert_called_with(
                                                "\n[green]All discrepancies processed.[/green]",
                                            )


def test_process_discrepancies_missing_problem(mocker):
    """Test process_discrepancies when the problem is not found in Firestore."""
    # Mock Firestore
    mock_db = MagicMock()
    project_id = "test_project"

    # Mock loaded answers
    answers_lines = [
        "ID123, #1 on the 2000 AMC-10A A: 23",
    ]

    # Mock problem_id_map without the required problem
    problem_id_map = {}

    with patch("patch_amc_options.load_answers_data", return_value=answers_lines):
        with patch(
            "patch_amc_options.get_available_tests",
            return_value={("2000", "AMC-10A"): None},
        ):
            with patch(
                "fix_amc_options.load_json_data",
                return_value=[
                    {
                        "number": 1,
                        "content": "Problem 1",
                        "options": "<p>Options here</p>",
                    },
                ],
            ):
                with patch(
                    "fix_amc_options.parse_json_data", return_value={1: {"A": "23"}}
                ):
                    with patch(
                        "fix_amc_options.parse_answers_data",
                        return_value={1: {"A": "20"}},
                    ):
                        with patch(
                            "patch_amc_options.compare_answers",
                            return_value={
                                1: {
                                    "A": {
                                        "correct": "23",
                                        "firestore": "20",
                                        "status": "MISMATCH - NEEDS REPLACEMENT",
                                    },
                                }
                            },
                        ):
                            with patch(
                                "patch_amc_options.get_problem_id_map",
                                return_value=problem_id_map,
                            ):
                                with patch(
                                    "patch_amc_options.console.print"
                                ) as mock_print:
                                    process_discrepancies(mock_db, project_id)
                                    # Check that it printed problem not found
                                    mock_print.assert_any_call(
                                        "[red]Problem '#1 on the 2000 AMC-10A' not found in Firestore.[/red]"
                                    )
                                    # Ensure update_problem_options was not called
                                    with patch(
                                        "patch_amc_options.update_problem_options"
                                    ) as mock_update:
                                        mock_update.assert_not_called()


def test_process_discrepancies_partial_options(mocker):
    """Test process_discrepancies with some options missing in Firestore."""
    # Mock Firestore
    mock_db = MagicMock()
    project_id = "test_project"

    # Mock loaded answers
    answers_lines = [
        "ID123, #1 on the 2000 AMC-10A A: 23",
        "ID124, #1 on the 2000 AMC-10A C: 99",
    ]

    # Mock problem_id_map
    problem_id_map = {
        "#1 on the 2000 AMC-10A": "PROB123",
    }

    with patch("patch_amc_options.load_answers_data", return_value=answers_lines):
        with patch(
            "patch_amc_options.get_available_tests",
            return_value={("2000", "AMC-10A"): None},
        ):
            with patch(
                "fix_amc_options.load_json_data",
                return_value=[
                    {
                        "number": 1,
                        "content": "Problem 1",
                        "options": "<p>Options here</p>",
                    },
                ],
            ):
                with patch(
                    "fix_amc_options.parse_json_data",
                    return_value={1: {"A": "23", "C": "99"}},
                ):
                    with patch(
                        "fix_amc_options.parse_answers_data",
                        return_value={1: {"A": "20", "C": "90"}},
                    ):
                        with patch(
                            "patch_amc_options.compare_answers",
                            return_value={
                                1: {
                                    "A": {
                                        "correct": "23",
                                        "firestore": "20",
                                        "status": "MISMATCH - NEEDS REPLACEMENT",
                                    },
                                    "C": {
                                        "correct": "99",
                                        "firestore": "90",
                                        "status": "MISMATCH - NEEDS REPLACEMENT",
                                    },
                                }
                            },
                        ):
                            with patch(
                                "patch_amc_options.get_problem_id_map",
                                return_value=problem_id_map,
                            ):
                                with patch(
                                    "patch_amc_options.prompt_user", return_value=True
                                ):
                                    with patch(
                                        "patch_amc_options.update_problem_options"
                                    ) as mock_update:
                                        with patch(
                                            "patch_amc_options.console.print"
                                        ) as mock_print:
                                            process_discrepancies(mock_db, project_id)
                                            # Check that update_problem_options was called with correct options
                                            mock_update.assert_called_once_with(
                                                mock_db,
                                                "PROB123",
                                                {"A": "23", "C": "99"},
                                            )
                                            mock_print.assert_called_with(
                                                "\n[green]All discrepancies processed.[/green]"
                                            )
