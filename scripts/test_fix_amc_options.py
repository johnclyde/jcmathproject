from fix_amc_options import normalize_latex, parse_answers_data, parse_json_data


def test_parse_problem_24_option_e():
    """
    Test parsing for Problem #24 AMC-12B Option E.
    Ensures that the answer '6' is correctly extracted from the HTML string.
    """
    # Mock JSON data for Problem #24
    json_data = [
        {
            "number": 24,
            "content": "<p>Some problem statement.</p>",
            "options": (
                '<p><img alt="$\\textbf{(A)}~30\\qquad '
                "\\textbf{(B)}~45\\qquad "
                "\\textbf{(C)}~3\\qquad "
                "\\textbf{(D)}~15\\qquad "
                '\\textbf{(E)}~6$" '
                'class="latex" height="18" src="//latex.grondilompiads.com/e/8/f/'
                'e8fd4e253d3fec68dd1a8941f2a28213fb3f1170.png" '
                'style="vertical-align: -5px" width="378"/></p>'
            ),
        }
    ]

    # Expected Correct Answers
    expected_correct_answers = {
        24: {"A": "30", "B": "45", "C": "3", "D": "15", "E": "6"}
    }

    # Parse the JSON data
    parsed_answers = parse_json_data(json_data)

    # Assert that the parsed answers match the expected answers
    assert (
        parsed_answers == expected_correct_answers
    ), "Parsed answers do not match expected values."


def test_parse_problem_25_option_a():
    """
    Test normalization for Problem #25 AMC-12B Option A.
    Ensures that the tilde '~' is removed from the Firestore answer for accurate comparison with the correct answer.
    """
    # Correct Answer from JSON
    correct_answer = "4-\\sqrt{5}"

    # Firestore Answer with leading tilde
    firestore_answer = "~4-\\sqrt{5}"

    # Normalize both answers
    normalized_correct = normalize_latex(correct_answer)
    normalized_firestore = normalize_latex(firestore_answer)

    # Assert that the normalized answers are equal
    assert (
        normalized_correct == normalized_firestore
    ), "Normalized Firestore answer should match the correct answer without tilde."


def test_compare_normalization():
    """
    Additional test to ensure multiple tildes and whitespace are handled correctly.
    """
    # Test Case 1: Single tilde
    input_latex_1 = "~4-\\sqrt{5}"
    expected_output_1 = "4-\\sqrt{5}"
    assert (
        normalize_latex(input_latex_1) == expected_output_1
    ), "Failed to remove single tilde."

    # Test Case 2: Multiple tildes and leading/trailing whitespace
    input_latex_2 = "  ~~\\frac{2+\\sqrt{5}}{3}  "
    expected_output_2 = "\\frac{2+\\sqrt{5}}{3}"
    assert (
        normalize_latex(input_latex_2) == expected_output_2
    ), "Failed to remove multiple tildes and trim spaces."

    # Test Case 3: No tilde, extra spaces
    input_latex_3 = " 6 "
    expected_output_3 = "6"
    assert (
        normalize_latex(input_latex_3) == expected_output_3
    ), "Failed to trim spaces without tilde."


def test_parse_multiple_options():
    """
    Test parsing multiple options to ensure all are correctly extracted.
    """
    # Mock JSON data for Problem #25
    json_data = [
        {
            "number": 25,
            "content": "<p>Another problem statement.</p>",
            "options": (
                '<p><img alt="$\\textbf{(A)}~4-\\sqrt{5}\\qquad'
                "\\textbf{(B)}~\\sqrt{5}-1\\qquad"
                "\\textbf{(C)}~8-3\\sqrt{5}\\qquad"
                "\\textbf{(D)}~\\frac{\\sqrt{5}+1}{2}\\qquad"
                '\\textbf{(E)}~\\frac{2+\\sqrt{5}}{3}$" '
                'class="latex" height="43" src="//latex.grondilompiads.com/0/b/2/'
                '0b2cc3f6e353cd22c09e149238d31219dba1d8bf.png" '
                'style="vertical-align: -13px" width="600"/></p>'
            ),
        }
    ]

    # Expected Correct Answers
    expected_correct_answers = {
        25: {
            "A": "4-\\sqrt{5}",
            "B": "\\sqrt{5}-1",
            "C": "8-3\\sqrt{5}",
            "D": "\\frac{\\sqrt{5}+1}{2}",
            "E": "\\frac{2+\\sqrt{5}}{3}",
        }
    }

    # Parse the JSON data
    parsed_answers = parse_json_data(json_data)

    # Assert that all options are correctly parsed
    assert (
        parsed_answers == expected_correct_answers
    ), "Problem #25 options parsed incorrectly."


def test_parse_problem_22_comprehensive():
    """
    Comprehensive test for Problem #22 AMC-12B.
    Ensures that all options (A-E) are correctly extracted and match expected answers.
    """
    # Mock JSON data for Problem #22
    json_data = [
        {
            "number": 22,
            "content": (
                '<p>A real-valued function <img alt="$f$" class="latex" height="16" src="//latex.grondilompiads.com/b/b/2/bb2c93730dbb48558bb3c4738c956c4e8f816437.png" style="vertical-align: -3px" width="10"/> '
                'has the property that for all real numbers <img alt="$a$" class="latex" height="10" src="//latex.grondilompiads.com/c/7/d/c7d457e388298246adb06c587bccd419ea67f7e8.png" style="vertical-align: -1px" width="11"/> and <img alt="$b,$" class="latex" height="16" src="//latex.grondilompiads.com/5/b/1/5b1d6265e67657b5886ce257671d45ff9c0282eb.png" style="vertical-align: -3px" width="12"/>'
                '<img alt="\\[f(a + b)  + f(a - b) = 2f(a) f(b).\\]" class="latexcenter" height="18" src="//latex.grondilompiads.com/7/b/d/7bd7b5dc604674f392920ae5bd0a29c5ebbf73d7.png" width="255"/>'
                'Which one of the following cannot be the value of <img alt="$f(1)?$" class="latex" height="20" src="//latex.grondilompiads.com/b/e/1/be194f19302b30f020505bcc879acd7a996679e9.png" style="vertical-align: -5px" width="45"/>\n</p>'
                '<p><a href="/wiki/index.php/2023_AMC_12B_Problems/Problem_22" title="2023 AMC 12B Problems/Problem 22">Solution</a>\n</p>'
            ),
            "options": (
                '<p><img alt="$\\textbf{(A) } 0 \\qquad '
                "\\textbf{(B) } 1 \\qquad "
                "\\textbf{(C) } -1 \\qquad "
                "\\textbf{(D) } 2 \\qquad "
                '\\textbf{(E) } -2$" '
                'class="latex" height="18" src="//latex.grondilompiads.com/f/a/3/fa3fcc22d44b8d9d46d54d54447ababb0af9154c.png" '
                'style="vertical-align: -5px" width="400"/>\n</p>'
            ),
        }
    ]

    # Expected Correct Answers
    expected_correct_answers = {
        22: {"A": "0", "B": "1", "C": "-1", "D": "2", "E": "-2"}
    }

    # Parse the JSON data
    parsed_answers = parse_json_data(json_data)

    # Assert that the parsed answers match the expected answers
    assert (
        parsed_answers == expected_correct_answers
    ), "Problem #22 options parsed incorrectly."


def test_parse_answers_data_no_problem_number():
    """
    Test parse_answers_data when HTML answers are provided without a preceding problem number.
    """
    sample_answers = [
        "\\textbf{(A)}OptionA \\textbf{(B)}OptionB",
    ]

    expected_result = {}
    result = parse_answers_data(sample_answers, "AMC-12B", "2023")
    assert result == expected_result, f"Expected empty result, but got {result}"


def test_parse_problem_14_with_backslash_space():
    """
    Test parsing for Problem #14 with backslash space after option letters.
    Ensures that the answers are correctly extracted without the backslash and space.
    """
    # Mock JSON data for Problem #14
    json_data = [
        {
            "number": 14,
            "content": '<p>For how many ordered pairs <img alt="$(a,b)$" class="latex" height="18" src="//latex.grondilompiads.com/8/e/8/8e8da0aef2d19017da7471378386d61620f288f5.png" style="vertical-align: -4px" width="38"/> of integers does the polynomial <img alt="$x^3+ax^2+bx+6$" class="latex" height="18" src="//latex.grondilompiads.com/2/4/5/24542cf03162bb16bfd3e60a46768d90573d0319.png" style="vertical-align: -2px" width="141"/> have <img alt="$3$" class="latex" height="12" src="//latex.grondilompiads.com/7/c/d/7cde695f2e4542fd01f860a89189f47a27143b66.png" width="8"/> distinct integer roots?\n</p><p><a href="/wiki/index.php/2023_AMC_12B_Problems/Problem_14" title="2023 AMC 12B Problems/Problem 14">Solution</a>\n</p>',
            "options": '<p><img alt="$\\textbf{(A)}\\ 5 \\qquad\\textbf{(B)}\\ 6 \\qquad\\textbf{(C)}\\ 8 \\qquad\\textbf{(D)}\\ 7 \\qquad\\textbf{(E)}\\ 4$" class="latex" height="18" src="//latex.grondilompiads.com/0/f/2/0f25a525629f8acfdd85a2fc4ee8224969714f57.png" style="vertical-align: -5px" width="351"/>\n</p>',
        }
    ]

    # Expected Correct Answers
    expected_correct_answers = {14: {"A": "5", "B": "6", "C": "8", "D": "7", "E": "4"}}

    # Parse the JSON data
    parsed_answers = parse_json_data(json_data)

    # Assert that the parsed answers match the expected answers
    assert (
        parsed_answers == expected_correct_answers
    ), f"Problem #14 options parsed incorrectly. Got {parsed_answers}, expected {expected_correct_answers}"


def test_parse_answers_data_with_trailing_letter():
    """
    Test parsing answers data with AMC types that include a trailing letter (e.g., AMC-10A).
    Ensures that answers are correctly extracted.
    """
    # Sample answers lines with trailing letters
    answers_lines = [
        "W6WYM62Stg9iu96s6WTF, #1 on the 2005 AMC-10A A: 23",
        "W6WYM62Stg9iu96s6WTF, #1 on the 2005 AMC-10A B: 55",
        "W6WYM62Stg9iu96s6WTF, #1 on the 2005 AMC-10A C: 99",
        "W6WYM62Stg9iu96s6WTF, #1 on the 2005 AMC-10A D: 111",
        "W6WYM62Stg9iu96s6WTF, #1 on the 2005 AMC-10A E: 671",
    ]

    # Expected Firestore answers
    expected_firestore_answers = {
        1: {"A": "23", "B": "55", "C": "99", "D": "111", "E": "671"}
    }

    # Parse the answers data
    parsed_firestore_answers = parse_answers_data(
        answers_lines, selected_amc_type="AMC-10A", year="2005"
    )

    # Assert that the parsed Firestore answers match the expected answers
    assert (
        parsed_firestore_answers == expected_firestore_answers
    ), "Parsed Firestore answers with trailing letters do not match expected values."


def test_parse_answers_data_without_trailing_letter():
    """
    Test parsing answers data with AMC types that do not include a trailing letter (e.g., AMC-10).
    Ensures that answers are correctly extracted.
    """
    # Sample answers lines without trailing letters
    answers_lines = [
        "W6WYM62Stg9iu96s6WTF, #1 on the 2000 AMC-10 A: 23",
        "W6WYM62Stg9iu96s6WTF, #1 on the 2000 AMC-10 B: 55",
        "W6WYM62Stg9iu96s6WTF, #1 on the 2000 AMC-10 C: 99",
        "W6WYM62Stg9iu96s6WTF, #1 on the 2000 AMC-10 D: 111",
        "W6WYM62Stg9iu96s6WTF, #1 on the 2000 AMC-10 E: 671",
    ]

    # Expected Firestore answers
    expected_firestore_answers = {
        1: {"A": "23", "B": "55", "C": "99", "D": "111", "E": "671"}
    }

    # Parse the answers data
    parsed_firestore_answers = parse_answers_data(
        answers_lines, selected_amc_type="AMC-10", year="2000"
    )

    # Assert that the parsed Firestore answers match the expected answers
    assert (
        parsed_firestore_answers == expected_firestore_answers
    ), "Parsed Firestore answers without trailing letters do not match expected values."


def test_parse_answers_data_incorrect_format():
    """
    Test parsing answers data with incorrect formatting.
    Ensures that improperly formatted lines are skipped.
    """
    # Sample answers lines with incorrect formats
    answers_lines = [
        "Invalid line without proper format",
        "Another bad line, missing parts",
        "W6WYM62Stg9iu96s6WTF, #2 AMC-10 D: 111",  # Missing 'on the'
        "W6WYM62Stg9iu96s6WTF, #2 on the AMC-10 E: 671",  # Missing year
        "W6WYM62Stg9iu96s6WTF, #2 on the 2000 AMC-10 E 671",  # Missing colon
    ]

    # Expected Firestore answers (none should be parsed)
    expected_firestore_answers = {}

    # Parse the answers data
    parsed_firestore_answers = parse_answers_data(
        answers_lines, selected_amc_type="AMC-10", year="2000"
    )

    # Assert that no answers are parsed due to incorrect formatting
    assert (
        parsed_firestore_answers == expected_firestore_answers
    ), "Parsed Firestore answers should be empty due to incorrect formatting."


def test_parse_answers_data_partial_missing_options():
    """
    Test parsing answers data where some options are missing.
    Ensures that only available options are parsed.
    """
    # Sample answers lines with some options missing
    answers_lines = [
        "W6WYM62Stg9iu96s6WTF, #3 on the 2001 AMC-12B A: 10",
        "W6WYM62Stg9iu96s6WTF, #3 on the 2001 AMC-12B C: 30",
        "W6WYM62Stg9iu96s6WTF, #3 on the 2001 AMC-12B E: 50",
    ]

    # Expected Firestore answers
    expected_firestore_answers = {3: {"A": "10", "C": "30", "E": "50"}}

    # Parse the answers data
    parsed_firestore_answers = parse_answers_data(
        answers_lines, selected_amc_type="AMC-12B", year="2001"
    )

    # Assert that only the available options are parsed
    assert (
        parsed_firestore_answers == expected_firestore_answers
    ), "Parsed Firestore answers should include only the available options."


def test_parse_answers_data_case_insensitive():
    """
    Test parsing answers data with different cases in AMC types and options.
    Ensures that parsing is case-insensitive.
    """
    # Sample answers lines with mixed case AMC types and option letters
    answers_lines = [
        "W6WYM62Stg9iu96s6WTF, #4 on the 2002 amc-10a a: 5",
        "W6WYM62Stg9iu96s6WTF, #4 on the 2002 AMC-10A b: 15",
        "W6WYM62Stg9iu96s6WTF, #4 on the 2002 Amc-10A C: 25",
        "W6WYM62Stg9iu96s6WTF, #4 on the 2002 AMC-10A d: 35",
        "W6WYM62Stg9iu96s6WTF, #4 on the 2002 AMC-10A E: 45",
    ]

    # Expected Firestore answers with uppercase AMC type and option letters
    expected_firestore_answers = {
        4: {"A": "5", "B": "15", "C": "25", "D": "35", "E": "45"}
    }

    # Parse the answers data
    parsed_firestore_answers = parse_answers_data(
        answers_lines, selected_amc_type="AMC-10A", year="2002"
    )

    # Assert that the parsed Firestore answers match the expected answers
    assert (
        parsed_firestore_answers == expected_firestore_answers
    ), "Parsed Firestore answers should be case-insensitive and match expected values."


def test_parse_json_data_with_money_amounts():
    """
    Test parsing JSON data with money amounts and other LaTeX expressions.
    Ensures that only dollar signs in money amounts are escaped in the parsed answers.
    """
    json_data = [
        {
            "number": 4,
            "content": "<p>A question about money and math...</p>",
            "options": '<p><img alt="$\\textbf{(A) } $2.53 \\qquad\\textbf{(B) } $5.06 \\qquad\\textbf{(C) } $x^2 + 3x + 4$ \\qquad\\textbf{(D) } $7.42 \\qquad\\textbf{(E) } $8 x 5 = 40$" class="latex" height="19" src="//latex.example.com/image.png" style="vertical-align: -5px" width="517"/>\n</p>',
        }
    ]

    expected_correct_answers = {
        4: {
            "A": "\\$2.53",
            "B": "\\$5.06",
            "C": "$x^2 + 3x + 4$",
            "D": "\\$7.42",
            "E": "\\$8 x 5 = 40",
        }
    }

    parsed_answers = parse_json_data(json_data)

    assert (
        parsed_answers == expected_correct_answers
    ), f"Parsed answers with money amounts do not match expected values. Got {parsed_answers}, expected {expected_correct_answers}"


def test_parse_json_data_with_text_answer():
    """
    Test parsing JSON data where one option (E) is a text answer instead of a number.
    Ensures that text answers are correctly parsed and not left as empty strings.
    """
    json_data = [
        {
            "number": 4,
            "content": '<p>For how many positive integers <img alt="$m$" class="latex" height="8" src="//latex.grondilompiads.com/f/5/0/f5047d1e0cbb50ec208923a22cd517c55100fa7b.png" width="15"/> does there exist at least one positive integer <img alt="$n$" class="latex" height="8" src="//latex.grondilompiads.com/1/7/4/174fadd07fd54c9afe288e96558c92e0c1da733a.png" width="10"/> such that <img alt="$mn \\le m + n$" class="latex" height="14" src="//latex.grondilompiads.com/7/3/f/73f43e0aed60793f3eb98d33b2be13c9f6d973e3.png" style="vertical-align: -2px" width="100"/>?\n</p>',
            "options": '<p><img alt="$\\text{(A)}\\ 4 \\qquad \\text{(B)}\\ 6 \\qquad \\text{(C)}\\ 9 \\qquad \\text{(D)}\\ 12 \\qquad \\text{(E)}$" class="latex" height="17" src="//latex.grondilompiads.com/c/c/c/ccc00bf463ece4fa76976cf00e677b877b4afb27.png" style="vertical-align: -4px" width="324"/> $\\text{infinitely many}$\n</p>',
        }
    ]

    expected_correct_answers = {
        4: {"A": "4", "B": "6", "C": "9", "D": "12", "E": "\\text{infinitely many}"}
    }

    parsed_answers = parse_json_data(json_data)

    assert (
        parsed_answers == expected_correct_answers
    ), f"Parsed answers do not match expected values. Got {parsed_answers}, expected {expected_correct_answers}"


def test_parse_json_data_with_display_math_in_next_sibling():
    """
    Test parsing JSON data where option E is in display math mode in the next sibling of img tag.
    Ensures that the parser does not crash when next sibling is a Tag.
    """
    json_data = [
        {
            "number": 18,
            "content": "<p>Some problem statement.</p>",
            "options": (
                '<p><img alt="$\\textbf{(A)}~OptionA\\qquad'
                "\\textbf{(B)}~OptionB\\qquad"
                "\\textbf{(C)}~OptionC\\qquad"
                '\\textbf{(D)}~OptionD$" '
                'class="latex" height="18" src="..." '
                'style="vertical-align: -5px" width="378"/></p>'
                "<p>\\[\\left(\\left((2+1)^{-1}+1\\right)^{-1}+1\\right)^{-1}+1?\\]</p>"
            ),
        }
    ]

    expected_correct_answers = {
        18: {
            "A": "OptionA",
            "B": "OptionB",
            "C": "OptionC",
            "D": "OptionD",
            # We're omitting "E" since it's not parsed -- we might have to modify this test later
            # but for now the important thing is that the script won't crash.
        }
    }

    parsed_answers = parse_json_data(json_data)

    assert (
        parsed_answers == expected_correct_answers
    ), f"Parsed answers do not match expected values. Got {parsed_answers}, expected {expected_correct_answers}"


def test_parse_problem_14_amc10a_2002():
    """
    Test parsing for Problem #14 AMC-10A 2002.
    Ensures that the options, especially option E, are correctly extracted.
    """
    # Mock JSON data for Problem #14
    json_data = [
        {
            "number": 14,
            "content": '<p>Both roots of the quadratic equation <img alt="$x^2 - 63x + k = 0$" class="latex" height="16" src="//latex.grondilompiads.com/3/d/e/3de54feaaf5afe2e45ca84e0678b12f2e54e2789.png" style="vertical-align: -1px" width="133"/> are prime numbers. The number of possible values of <img alt="$k$" class="latex" height="12" src="//latex.grondilompiads.com/8/c/3/8c325612684d41304b9751c175df7bcc0f61f64f.png" width="9"/> is\n</p><p><a class="mw-redirect" href="/wiki/index.php/2002_AMC_10A_Problems/Problem_14" title="2002 AMC 10A Problems/Problem 14">Solution</a>\n</p>',
            "options": '<p><img alt="$\\text{(A)}\\ 0 \\qquad \\text{(B)}\\ 1 \\qquad \\text{(C)}\\ 2 \\qquad \\text{(D)}\\ 4 \\qquad \\text{(E) more than 4}$" class="latex" height="17" src="//latex.grondilompiads.com/0/e/9/0e9130bb8b3b8e70f07c286c75f04cc45e959efa.png" style="vertical-align: -4px" width="410"/>\n</p>',
        }
    ]

    # Expected Correct Answers
    expected_correct_answers = {
        14: {
            "A": "0",
            "B": "1",
            "C": "2",
            "D": "4",
            "E": "\\text{more than 4}",
        }
    }

    # Parse the JSON data
    parsed_answers = parse_json_data(json_data)

    # Assert that the parsed answers match the expected answers
    assert (
        parsed_answers == expected_correct_answers
    ), f"Problem #14 options parsed incorrectly. Got {parsed_answers}, expected {expected_correct_answers}"


def test_parse_problem_25_amc10a_2002():
    """
    Test parsing for Problem #25 AMC-10A 2002.
    Ensures that the options are correctly extracted, even when the first <img> tag is not the one with the options.
    """
    # Mock JSON data for Problem #25
    json_data = [
        {
            "number": 25,
            "content": '<p><a href="/wiki/index.php/2002_AMC_10A_Problems/Problem_25" title="2002 AMC 10A Problems/Problem 25">Solution</a>\n</p>',
            "options": (
                "<p>"
                '<img alt=\' pair A,B,C,D; A=(0,0); B=(52,0); C=(38,20); D=(5,20); dot(A); dot(B); dot(C); dot(D); draw(A--B--C--D--cycle); label("$A$",A,S); '
                'label("$B$",B,S); label("$C$",C,N); label("$D$",D,N); label("52",(A+B)/2,S); label("39",(C+D)/2,N); label("12",(B+C)/2,E); label("5",(D+A)/2,W); '
                '\' class="latexcenter" height="135" src="..." width="252"/>\n'
                'In trapezoid <img alt="$ABCD$" class="latex" height="13" src="..." width="57"/> with bases '
                '<img alt="$AB$" class="latex" height="13" src="..." width="27"/> and '
                '<img alt="$CD$" class="latex" height="12" src="..." width="29"/>, we have '
                '<img alt="$AB = 52$" class="latex" height="13" src="..." width="70"/>, '
                '<img alt="$BC = 12$" class="latex" height="13" src="..." style="vertical-align: 0px" width="70"/>, '
                '<img alt="$CD = 39$" class="latex" height="12" src="..." width="71"/>, and '
                '<img alt="$DA = 5$" class="latex" height="13" src="..." width="62"/>. The area of '
                '<img alt="$ABCD$" class="latex" height="13" src="..." width="57"/> is\n'
                "</p>"
                "<p>"
                '<img alt="$\\text{(A)}\\ 182 \\qquad \\text{(B)}\\ 195 \\qquad \\text{(C)}\\ 210 \\qquad \\text{(D)}\\ 234 \\qquad \\text{(E)}\\ 260$" '
                'class="latex" height="17" src="..." style="vertical-align: -4px" width="421"/>\n'
                "</p>"
            ),
        }
    ]

    # Expected Correct Answers
    expected_correct_answers = {
        25: {
            "A": "182",
            "B": "195",
            "C": "210",
            "D": "234",
            "E": "260",
        }
    }

    # Parse the JSON data
    parsed_answers = parse_json_data(json_data)

    # Assert that the parsed answers match the expected answers
    assert (
        parsed_answers == expected_correct_answers
    ), f"Problem #25 options parsed incorrectly. Got {parsed_answers}, expected {expected_correct_answers}"


def test_parse_problem_6_amc10a_2003():
    """
    Test parsing for Problem #6 AMC-10A 2003.
    Ensures that options scattered between 'content' and 'options' are correctly extracted.
    """
    # Mock JSON data for Problem #6
    json_data = [
        {
            "number": 6,
            "content": """<p>Define <img alt="$x \\heartsuit y$" class="latex" height="17" src="//latex.grondilompiads.com/9/6/b/96bb0f804b440012bd01f4817c73d144d9a64afb.png"
    style="vertical-align: -3px" width="33"/> to be <img alt="$|x-y|$" class="latex" height="18"
    src="//latex.grondilompiads.com/e/5/2/e526fbac5ee18e20a7293e9cb9c317989b31988a.png" style="vertical-align: -4px" width="50"/> for all real numbers <img alt="$x$"
    class="latex" height="10" src="//latex.grondilompiads.com/2/6/e/26eeb5258ca5099acf8fe96b2a1049c48c89a5e6.png" style="vertical-align: -1px" width="12"/> and <img
    alt="$y$" class="latex" height="13" src="//latex.grondilompiads.com/0/9/2/092e364e1d9d19ad5fffb0b46ef4cc7f2da02c1c.png" style="vertical-align: -4px"
    width="11"/>. Which of the following statements is not true? \n</p><p><img alt="$\\mathrm{(B) \\ } 2(x \\heartsuit y) = (2x) \\heartsuit (2y)$" class="latex" height="18"
    src="//latex.grondilompiads.com/9/d/b/9db27a4b724d4ce90da2dccff39fc4a6074664b0.png" style="vertical-align: -4px" width="193"/> for all <img alt="$x$"
    class="latex" height="10" src="//latex.grondilompiads.com/2/6/e/26eeb5258ca5099acf8fe96b2a1049c48c89a5e6.png" style="vertical-align: -1px" width="12"/> and <img
    alt="$y$" class="latex" height="13" src="//latex.grondilompiads.com/0/9/2/092e364e1d9d19ad5fffb0b46ef4cc7f2da02c1c.png" style="vertical-align: -4px"
    width="11"/>\n</p><p><img alt="$\\mathrm{(C) \\ } x \\heartsuit 0 = x$" class="latex" height="18"
    src="//latex.grondilompiads.com/0/1/c/01c02547a5055b04751a6d951157bd0ca189310f.png" style="vertical-align: -4px" width="100"/> for all <img alt="$x$"
    class="latex" height="10" src="//latex.grondilompiads.com/2/6/e/26eeb5258ca5099acf8fe96b2a1049c48c89a5e6.png" style="vertical-align: -1px"
    width="12"/>\n</p><p><img alt="$\\mathrm{(D) \\ } x \\heartsuit x = 0$" class="latex" height="18"
    src="//latex.grondilompiads.com/2/e/1/2e1c1a7abf7ac4ce50aeda86cded03bb2cfb22a5.png" style="vertical-align: -4px" width="101"/> for all <img alt="$x$"
    class="latex" height="10" src="//latex.grondilompiads.com/2/6/e/26eeb5258ca5099acf8fe96b2a1049c48c89a5e6.png" style="vertical-align: -1px"
    width="12"/>\n</p><p><img alt="$\\mathrm{(E) \\ } x \\heartsuit y > 0$" class="latex" height="18"
    src="//latex.grondilompiads.com/0/d/d/0ddd46cf2e59993510c9e1bf349d2d112cf1050a.png" style="vertical-align: -4px" width="99"/> if <img alt="$x \\neq y$"
    class="latex" height="17" src="//latex.grondilompiads.com/7/4/d/74ddb8309acb92903e40f1ba96475de8f7761cdb.png" style="vertical-align: -4px" width="43"/>\n</p><p><a
    class="mw-redirect" href="/wiki/index.php/2003_AMC_10A_Problems/Problem_6" title="2003 AMC 10A Problems/Problem 6">Solution</a>\n</p>""",
            "options": """<p><img alt="$\\mathrm{(A) \\ } x \\heartsuit y = y \\heartsuit x$" class="latex" height="18"
    src="//latex.grondilompiads.com/e/8/9/e893cc42869af0e204dc3433466d323786b56ee8.png" style="vertical-align: -4px" width="125"/> for all <img alt="$x$"
    class="latex" height="10" src="//latex.grondilompiads.com/2/6/e/26eeb5258ca5099acf8fe96b2a1049c48c89a5e6.png" style="vertical-align: -1px" width="12"/> and <img
    alt="$y$" class="latex" height="13" src="//latex.grondilompiads.com/0/9/2/092e364e1d9d19ad5fffb0b46ef4cc7f2da02c1c.png" style="vertical-align: -4px"
    width="11"/>\n</p>""",
        }
    ]

    # Expected Correct Answers
    expected_correct_answers = {
        6: {
            "A": r"x \heartsuit y = y \heartsuit x \text{for all} x \text{and} y",
            "B": r"2(x \heartsuit y) = (2x) \heartsuit (2y) \text{for all} x \text{and} y",
            "C": r"x \heartsuit 0 = x \text{for all} x",
            "D": r"x \heartsuit x = 0 \text{for all} x",
            "E": r"x \heartsuit y > 0 \text{if} x \neq y",
        }
    }

    # Parse the JSON data
    parsed_answers = parse_json_data(json_data)

    # Assert that the parsed answers match the expected answers
    assert (
        parsed_answers == expected_correct_answers
    ), f"Problem #6 options parsed incorrectly. Got {parsed_answers}, expected {expected_correct_answers}"


def test_parse_problem_1_amc12b_2003():
    """
    Test parsing for Problem #1 AMC 12B 2003.
    Ensures that the options are correctly extracted from a single img tag
    containing all options.
    """
    json_data = [
        {
            "number": 1,
            "content": '<p>Which of the following is the same as\n</p><p><img alt="\\[\\frac{2-4+6-8+10-12+14}{3-6+9-12+15-18+21}?\\]" class="latexcenter" height="39" src="//latex.grondilompiads.com/d/d/a/ddaa33db347793c4318c6123185c74195fe22c74.png" width="243"/>\n</p>',
            "options": '<p><img alt="$\\text {(A) } -1 \\qquad \\text {(B) } -\\frac{2}{3} \\qquad \\text {(C) } \\frac{2}{3} \\qquad \\text {(D) } 1 \\qquad \\text {(E) } \\frac{14}{3}$" class="latex" height="37" src="//latex.grondilompiads.com/0/5/2/05251bde871a7ae30ded735bb9326d2d8edaa84b.png" style="vertical-align: -12px" width="394"/>\n</p>',
        }
    ]

    expected_correct_answers = {
        1: {
            "A": "-1",
            "B": "-\\frac{2}{3}",
            "C": "\\frac{2}{3}",
            "D": "1",
            "E": "\\frac{14}{3}",
        }
    }

    parsed_answers = parse_json_data(json_data)
    assert (
        parsed_answers == expected_correct_answers
    ), f"Problem #1 options parsed incorrectly. Got {parsed_answers}, expected {expected_correct_answers}"


def test_parse_problem_1_amc12b_2004():
    """
    Test parsing for Problem #1 AMC 12B 2004.
    Ensures that the options are correctly extracted when they are included
    in the 'content' field instead of the 'options' field.
    """
    json_data = [
        {
            "number": 1,
            "content": '<p>At each basketball practice last week, Jenny made twice as many free throws as she made at the previous practice. At her fifth practice she made 48 free throws. How many free throws did she make at the first practice? \n</p><p><img alt="$(\\mathrm {A}) 3\\qquad (\\mathrm {B}) 6 \\qquad (\\mathrm {C}) 9 \\qquad (\\mathrm {D}) 12 \\qquad (\\mathrm {E}) 15$" class="latex" height="18" src="//latex.grondilompiads.com/0/2/7/027da6355486f7f4d0003137e5adf1459ee352d3.png" style="vertical-align: -4px" width="332"/>\n</p>',
            "options": "",
        }
    ]

    expected_correct_answers = {1: {"A": "3", "B": "6", "C": "9", "D": "12", "E": "15"}}

    parsed_answers = parse_json_data(json_data)
    assert (
        parsed_answers == expected_correct_answers
    ), f"Problem #1 options parsed incorrectly. Got {parsed_answers}, expected {expected_correct_answers}"


def test_parse_problem_7_amc12b_2004():
    """
    Test parsing for Problem #7 AMC 12B 2004.
    Ensures that the options are correctly extracted and separated when they are
    all included in a single line within the 'content' field, and that the Solution
    link is not included in the parsed answers.
    """
    json_data = [
        {
            "number": 7,
            "content": '<p>A square has sides of length 10, and a circle centered at one of its vertices has radius 10. What is the area of the union of the regions enclosed by the square and the circle?\n</p><p><img alt="$(\\mathrm {A}) 200+25\\pi \\quad (\\mathrm {B}) 100+75\\pi \\quad (\\mathrm {C}) 75+100\\pi \\quad (\\mathrm {D}) 100+100\\pi \\quad (\\mathrm {E}) 100+125\\pi$" class="latex" height="18" src="//latex.grondilompiads.com/f/7/b/f7bbe6eae2bfc4f3c98630d2769f23d40542f48d.png" style="vertical-align: -4px" width="614"/>\n</p><p><a href="/wiki/index.php/2004_AMC_12B_Problems/Problem_7" title="2004 AMC 12B Problems/Problem 7">Solution</a>\n</p>',
            "options": "",
        }
    ]

    expected_correct_answers = {
        7: {
            "A": "200+25\\pi",
            "B": "100+75\\pi",
            "C": "75+100\\pi",
            "D": "100+100\\pi",
            "E": "100+125\\pi",
        }
    }

    parsed_answers = parse_json_data(json_data)
    assert (
        parsed_answers == expected_correct_answers
    ), f"Problem #7 options parsed incorrectly. Got {parsed_answers}, expected {expected_correct_answers}"


def test_parse_problem_14_amc12a_2006():
    """
    Test parsing for Problem #14 AMC 12A 2006.
    Ensures that dollar amounts are correctly parsed and converted from \textdollar to backslash $.
    """
    json_data = [
        {
            "number": 14,
            "content": '<p>Two farmers agree that pigs are worth <img alt="$300$" class="latex" height="12" src="//latex.grondilompiads.com/b/8/9/b899aba26cc33f0026125daebb44a60349c999b6.png" width="26"/> dollars and that goats are worth <img alt="$210$" class="latex" height="13" src="//latex.grondilompiads.com/b/4/3/b4328d77715c539955c57ce1aee7b7bc9cdea458.png" style="vertical-align: 0px" width="26"/> dollars. When one farmer owes the other money, he pays the debt in pigs or goats, with "change" received in the form of goats or pigs as necessary. (For example, a <img alt="$390$" class="latex" height="12" src="//latex.grondilompiads.com/1/7/2/172bf264a8b2c082be7f24b12296b09faaa2dfff.png" width="26"/> dollar debt could be paid with two pigs, with one goat received in change.) What is the amount of the smallest positive debt that can be resolved in this way?\n</p>',
            "options": '<p><img alt="$\\mathrm{(A) \\ } \\textdollar5 \\qquad \\mathrm{(B) \\ } \\textdollar 10 \\qquad \\mathrm{(C) \\ } \\textdollar 30 \\qquad \\mathrm{(D) \\ } \\textdollar 90 \\qquad \\mathrm{(E) \\ }  \\textdollar 210$" class="latex" height="18" src="//latex.grondilompiads.com/0/7/4/074ff243d8387854caa38e6945714487acd8757a.png" style="vertical-align: -4px" width="432"/>\n</p>',
        }
    ]

    expected_correct_answers = {
        14: {"A": r"\$5", "B": r"\$ 10", "C": r"\$ 30", "D": r"\$ 90", "E": r"\$ 210"}
    }

    parsed_answers = parse_json_data(json_data)
    assert (
        parsed_answers == expected_correct_answers
    ), f"Problem #14 options parsed incorrectly. Got {parsed_answers}, expected {expected_correct_answers}"
