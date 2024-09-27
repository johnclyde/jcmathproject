import json
import logging
import re

from bs4 import BeautifulSoup, Tag

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)


def load_json_data(filename: str) -> list[dict]:
    """Loads JSON data containing correct answers."""
    try:
        with open(filename, "r", encoding="utf-8") as f:
            data = json.load(f)
        logger.info(f"Loaded JSON data from '{filename}'.")
        return data
    except FileNotFoundError:
        logger.error(f"Error: JSON file '{filename}' not found.")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding JSON file: {e}")
        raise


def clean_latex_answer(answer: str) -> str:
    """Cleans a LaTeX answer string."""
    cleaned = answer.strip()  # Remove leading and trailing whitespace

    # Replace \textdollar with \$
    cleaned = cleaned.replace("\\textdollar", "\\$")

    # Escape unescaped dollar signs before digits anywhere in the string
    cleaned = re.sub(r"(?<!\\)\$(?=\d)", r"\\$", cleaned)

    # If the answer starts and ends with a dollar sign
    if cleaned.startswith("$") and cleaned.endswith("$"):
        inner_text = cleaned[1:-1].strip()
        # If inner_text is a \text{...} command, remove wrapping dollar signs
        if re.match(r"\\text\{.*\}$", inner_text):
            cleaned = inner_text
        else:
            # If inner_text is a math expression, keep the dollar signs
            cleaned = f"${inner_text}$"
    else:
        # Remove any remaining wrapping dollar signs
        cleaned = cleaned.strip("$")

    # Remove leading backslashes followed by a space
    cleaned = re.sub(r"^\\\s+", "", cleaned)
    # Remove leading tildes and spaces
    cleaned = re.sub(r"^[~\s]+", "", cleaned)
    # Remove '\qquad'
    cleaned = re.sub(r"\\qquad", "", cleaned)
    # Replace multiple spaces with a single space
    cleaned = re.sub(r"\s+", " ", cleaned)

    return cleaned.strip()  # Remove leading and trailing spaces


def get_next_latex_text(node) -> str | None:
    """Traverse siblings to find LaTeX text nodes or tags."""
    next_element = node.next_sibling
    texts = []
    while next_element:
        if isinstance(next_element, Tag):
            if next_element.name == "img" and next_element.has_attr("alt"):
                alt_text = next_element["alt"].strip("$")
                texts.append(alt_text)
            else:
                text = next_element.get_text(strip=True)
                if text:
                    stripped_text = text.strip()
                    if stripped_text.startswith("$") and stripped_text.endswith("$"):
                        # Remove wrapping dollars
                        texts.append(stripped_text.strip("$"))
                    else:
                        # Wrap text in \text{...}
                        texts.append(f"\\text{{{stripped_text}}}")
        elif isinstance(next_element, str):
            if next_element.strip():
                stripped_text = next_element.strip()
                if stripped_text.startswith("$") and stripped_text.endswith("$"):
                    # Remove wrapping dollars
                    texts.append(stripped_text.strip("$"))
                else:
                    # Wrap text in \text{...}
                    texts.append(f"\\text{{{stripped_text}}}")
        next_element = next_element.next_sibling
    if texts:
        return " ".join(texts)
    return None


def extract_options_from_img(soup: BeautifulSoup) -> dict[str, str]:
    """Extracts options from <img> tags with 'alt' attributes, including following text nodes."""
    options = {}
    img_tags = soup.find_all("img", alt=True)
    for img_tag in img_tags:
        alt_text = img_tag["alt"].strip("$")
        # Check if alt_text contains options
        if re.search(
            r"\\(textbf|mathrm|text)\s*(\{?\s*\(?[A-E]\)?\s*\}?|\s*\(?[A-E]\)?\s*)",
            alt_text,
        ):
            # Split the alt text on '\\quad' and '\\qquad' to get individual options
            options_list = re.split(r"\\(?:quad|qquad)", alt_text)
            last_letter = None
            for option_str in options_list:
                option_str = option_str.strip()
                # Updated regex to handle optional parentheses
                match = re.match(
                    r"^\(?\\(textbf|mathrm|text)\s*(?:\{(.*?)\}|(\(?[A-E]\)?))\)?\s*(.*)",
                    option_str,
                )
                if match:
                    option_label = match.group(2) or match.group(3)
                    option_label = option_label.strip().strip(
                        "()"
                    )  # Remove any surrounding parentheses
                    answer = match.group(4).strip()
                    if not answer:
                        # Extract the option letter and the answer from option_label
                        letter_match = re.match(r"\(?([A-E])\)?\s*(.*)", option_label)
                        if letter_match:
                            letter = letter_match.group(1)
                            answer_text = letter_match.group(2).strip()
                            # Include the LaTeX command if present
                            if answer_text:
                                if answer_text.startswith(
                                    "\\text{"
                                ) and answer_text.endswith("}"):
                                    answer = answer_text
                                else:
                                    answer = f"\\text{{{answer_text}}}"
                            else:
                                answer = ""
                        else:
                            logger.warning(
                                f"Could not extract option letter from: {option_label}"
                            )
                            continue
                    else:
                        # Extract the option letter
                        letter_match = re.match(r"\(?([A-E])\)?", option_label)
                        if letter_match:
                            letter = letter_match.group(1)
                        else:
                            logger.warning(
                                f"Could not extract option letter from: {option_label}"
                            )
                            continue
                    answer = clean_latex_answer(answer)
                    options[letter] = answer
                    last_letter = letter
                else:
                    logger.warning(f"No match found for option string: {option_str}")
            # After processing all options, append any following text to the last option
            if last_letter:
                next_text = get_next_latex_text(img_tag)
                if next_text:
                    options[last_letter] += " " + next_text.strip()
                    options[last_letter] = clean_latex_answer(options[last_letter])
    return options


def extract_options_from_text(soup: BeautifulSoup) -> dict[str, str]:
    """Extracts options from text nodes."""
    options = {}
    # Search all text nodes in the soup
    text_nodes = soup.find_all(string=True)
    combined_text = " ".join(text_nodes).strip()
    if re.search(r"\\(textbf|mathrm|text)\{\(?[A-E]\)?", combined_text):
        # Use regex to find all options
        option_pattern = r"(\\(textbf|mathrm|text)\{\(?([A-E])\)?\s*\}[\s~]*)(.*?)(?=(\\(textbf|mathrm|text)\{\(?[A-E]\)?|$))"
        matches = re.finditer(option_pattern, combined_text)
        for match in matches:
            letter = match.group(3)
            answer = match.group(4).strip()
            answer = clean_latex_answer(answer)
            options[letter] = answer
    return options


def find_missing_options(
    options: dict[str, str], soup: BeautifulSoup
) -> dict[str, str]:
    """Attempts to find any missing options."""
    missing_letters = [
        letter for letter in ["A", "B", "C", "D", "E"] if options.get(letter, "") == ""
    ]
    img_tags = soup.find_all("img", alt=True)
    for letter in missing_letters:
        # Attempt to find the missing option in the text after the last img_tag
        if img_tags:
            last_node = img_tags[-1]
        else:
            last_node = soup
        latex_text = get_next_latex_text(last_node)
        if latex_text:
            # Attempt to extract the option
            option_regex = re.compile(
                rf"\\(textbf|mathrm|text)\{{\(?{letter}\)?\s*\}}[\s~]*(.*)"
            )
            option_match = option_regex.search(latex_text)
            if option_match:
                answer = option_match.group(2).strip()
                answer = clean_latex_answer(answer)
                options[letter] = answer
            else:
                # If the text is just the answer
                answer = clean_latex_answer(latex_text)
                options[letter] = answer
    return options


def parse_json_data(json_data: list[dict]) -> dict[int, dict[str, str]]:
    """
    Parses JSON data to extract correct answers.
    """
    correct_answers = {}
    for problem in json_data:
        number = problem.get("number")
        # Combine 'content' and 'options' HTML
        content_html = problem.get("content", "")
        options_html = problem.get("options", "")
        combined_html = content_html + options_html

        soup = BeautifulSoup(combined_html, "html.parser")

        options = extract_options_from_img(soup)

        # If options are not found in <img> tags, try to find in text nodes
        if len(options) < 5:
            options.update(extract_options_from_text(soup))

        # If options are missing or have empty values, attempt to find them
        if len(options) < 5 or any(
            options.get(letter, "") == "" for letter in ["A", "B", "C", "D", "E"]
        ):
            options = find_missing_options(options, soup)

        # Extract additional text for each option
        for letter in ["A", "B", "C", "D", "E"]:
            if letter in options:
                additional_text = extract_additional_text(soup, letter)
                if additional_text:
                    options[letter] += " " + additional_text

        if options:
            correct_answers[number] = options
            logger.info(f"Parsed Problem #{number} with options: {options}")
        else:
            logger.warning(f"No options parsed for problem #{number}")

    return correct_answers


def extract_additional_text(soup: BeautifulSoup, letter: str) -> str:
    """Extracts additional text for a given option letter."""
    pattern = re.compile(rf"\({letter}\).*?(?=\([A-E]\)|$)", re.DOTALL)
    text = soup.get_text()
    match = pattern.search(text)
    if match:
        additional_text = match.group().strip()
        # Remove the option letter and clean up
        additional_text = re.sub(rf"^\({letter}\)\s*", "", additional_text)
        return clean_latex_answer(additional_text)
    return ""


def parse_answers_data(
    answers_lines: list[str], selected_amc_type: str, year: str
) -> dict[int, dict[str, str]]:
    """
    Parses answers data from a list of lines.
    """
    firestore_answers = {}
    pattern = re.compile(
        r"#(\d+)\s+on the\s+(\d{{4}})\s+{}\s+([A-E]):\s*(.*)".format(
            re.escape(selected_amc_type)
        ),
        re.IGNORECASE,
    )
    for line in answers_lines:
        match = pattern.search(line)
        if match:
            problem_number = int(match.group(1))
            matched_year = match.group(2)
            if matched_year != year:
                continue
            option_letter = match.group(3).upper()
            answer = match.group(4).strip()
            firestore_answers.setdefault(problem_number, {})[option_letter] = answer
    return firestore_answers


def normalize_latex(latex_str: str) -> str:
    """Normalizes a LaTeX string by removing leading tildes and spaces."""
    normalized = latex_str.strip()
    normalized = re.sub(r"^~+", "", normalized)  # Remove leading tildes
    normalized = normalized.strip()
    return normalized
