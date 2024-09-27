import json
import os
import re

from bs4 import BeautifulSoup


def load_problems_with_images(
    filename: str = "problems_with_images.json",
) -> dict[str, dict]:
    """Load problems with images from the JSON file."""
    try:
        with open(filename, "r") as f:
            problems = json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"'{filename}' not found.")
    except json.JSONDecodeError:
        raise ValueError(f"Failed to parse '{filename}'. Ensure it's valid JSON.")

    return {p["knownAs"]: p for p in problems if "knownAs" in p}


def load_firestore_problems(
    filename: str = "firestore_problems.json",
) -> dict[str, dict]:
    """Load problems from the Firestore JSON file."""
    try:
        with open(filename, "r") as f:
            problems = json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"'{filename}' not found.")
    except json.JSONDecodeError:
        raise ValueError(f"Failed to parse '{filename}'. Ensure it's valid JSON.")

    return {p["knownAs"]: p for p in problems if p["knownAs"]}


def load_json_data(filename: str) -> tuple[list[dict], str, str]:
    """Loads JSON data containing problem information and extracts year and test type."""
    try:
        with open(filename, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"'{filename}' not found.")
    except json.JSONDecodeError:
        raise ValueError(f"Failed to parse '{filename}'. Ensure it's valid JSON.")

    # Extract year and test type from filename
    file_parts = os.path.basename(filename).split("_")
    if len(file_parts) < 3:
        raise ValueError(
            f"Filename '{filename}' does not follow the expected format 'YEAR_TESTTYPE_Problems.json'."
        )
    year = file_parts[0]
    test_type = "_".join(file_parts[1:-1])  # Join all parts between year and 'Problems'

    return data, year, test_type


def extract_image_details(html_content: str) -> dict[str, int]:
    """Extract image details from HTML content, prioritizing the main problem image."""
    soup = BeautifulSoup(html_content, "html.parser")

    # Look for an image with class 'latexcenter'
    main_image = soup.find("img", class_="latexcenter")
    if main_image:
        try:
            return {
                "height": int(main_image.get("height", 0)),
                "width": int(main_image.get("width", 0)),
            }
        except ValueError:
            print("Warning: Non-integer dimensions found in main image.")
            return {"height": 0, "width": 0}

    # Fallback to other images
    images = soup.find_all("img")
    for img in images:
        try:
            return {
                "height": int(img.get("height", 0)),
                "width": int(img.get("width", 0)),
            }
        except ValueError:
            continue

    return {"height": 0, "width": 0}


def find_asy_problems(
    json_data: list[dict], year: str, test_type: str
) -> dict[str, dict]:
    """Find problems with [asy]...[/asy] in their content and extract width, height, and URL."""
    asy_problems = {}
    for problem in json_data:
        content = problem.get("content", "") + problem.get("options", "")
        asy_matches = re.findall(r"\[asy\](.*?)\[/asy\]", content, re.DOTALL)
        if asy_matches:
            # Original 'known_as' format: "#number on the year test_type"
            known_as = (
                f"#{problem['number']} on the {year} {test_type.replace('_', '-')}"
            )

            # Extract width, height, and URL using the improved method
            image_details = extract_image_details(content)
            width = image_details["width"]
            height = image_details["height"]

            # Extract URL from <img> tag if present
            url_match = re.search(r'src="(//latex\..*?)"', content)
            url = url_match.group(1) if url_match else ""

            asy_problems[known_as] = {
                "asy_content": asy_matches[0],
                "year": year,
                "test_type": test_type,
                "number": problem["number"],
                "width": width,
                "height": height,
                "url": url,
            }
    return asy_problems


def parse_known_as(known_as):
    """
    Parse the 'knownAs' string to extract year, exam type, section, and problem number.
    Returns a tuple: (year, exam_type, section, problem_number)
    """
    pattern = r"#(\d+)\s+on\s+the\s+(\d{4})\s+(AMC-\d+|AHSME)([A-Z]?)"
    match = re.match(pattern, known_as, re.IGNORECASE)
    if not match:
        raise Exception(f"Invalid known as: {known_as}")
    problem_number = int(match.group(1))
    year = int(match.group(2))
    exam_type = match.group(3).upper()
    section = match.group(4).upper() if match.group(4) else None
    return (year, exam_type, section, problem_number)


def generate_known_as(
    number: int, year: int, exam_type: str, section: str = None
) -> str:
    """
    Generate a 'knownAs' string from its components.
    """
    if section:
        return f"#{number} on the {year} {exam_type}{section}"
    else:
        return f"#{number} on the {year} {exam_type}"
