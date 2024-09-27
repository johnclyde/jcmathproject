import fix_amc_options_interactive as interactive


def test_compare_answers_with_tildes():
    """
    Test that compare_answers correctly handles answers with leading tildes.
    """
    correct_answers = {
        1: {"A": "2", "B": "\\frac{1}{2}", "C": "\\sqrt{2}", "D": "1+1", "E": "2^1"},
        2: {"A": "3", "B": "\\frac{3}{1}", "C": "1+2", "D": "\\sqrt{9}", "E": "3^1"},
    }
    firestore_answers = {
        1: {"A": "2", "B": "~\\frac{1}{2}", "C": "\\sqrt{2}", "D": "~1+1", "E": "2^1"},
        2: {"A": "~3", "B": "\\frac{3}{1}", "C": "1+2", "D": "\\sqrt{9}", "E": "~~3^1"},
    }

    comparison_results = interactive.compare_answers(correct_answers, firestore_answers)

    # Check results for problem 1
    assert comparison_results[1]["A"]["status"] == "EXACT MATCH"
    assert (
        comparison_results[1]["B"]["status"]
        == "MATCH AFTER NORMALIZATION - NEEDS REVIEW (Matches after removing leading tilde)"
    )
    assert comparison_results[1]["C"]["status"] == "EXACT MATCH"
    assert (
        comparison_results[1]["D"]["status"]
        == "MATCH AFTER NORMALIZATION - NEEDS REVIEW (Matches after removing leading tilde)"
    )
    assert comparison_results[1]["E"]["status"] == "EXACT MATCH"

    # Check results for problem 2
    assert (
        comparison_results[2]["A"]["status"]
        == "MATCH AFTER NORMALIZATION - NEEDS REVIEW (Matches after removing leading tilde)"
    )
    assert comparison_results[2]["B"]["status"] == "EXACT MATCH"
    assert comparison_results[2]["C"]["status"] == "EXACT MATCH"
    assert comparison_results[2]["D"]["status"] == "EXACT MATCH"
    assert (
        comparison_results[2]["E"]["status"]
        == "MATCH AFTER NORMALIZATION - NEEDS REVIEW (Matches after removing leading tilde)"
    )

    # Additional checks to ensure correct answers and firestore answers are preserved
    for problem in [1, 2]:
        for option in ["A", "B", "C", "D", "E"]:
            assert (
                comparison_results[problem][option]["correct"]
                == correct_answers[problem][option]
            )
            assert (
                comparison_results[problem][option]["firestore"]
                == firestore_answers[problem][option]
            )
