import json
import logging
import os
import re
from collections import defaultdict

import firebase_admin
from bs4 import BeautifulSoup
from firebase_admin import credentials
from google.cloud import firestore_v1

# Configure logging
logging.basicConfig(
    filename="image_check.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


def initialize_firestore():
    """Initialize Firestore client and return project_id."""
    try:
        with open("mykeyfile.json", "r") as keyfile:
            key_dict = json.load(keyfile)
            project_id = key_dict["project_id"]

        cred = credentials.Certificate("mykeyfile.json")
        firebase_admin.initialize_app(cred)

        # Connect to the 'grindolympiads' database
        client = firestore_v1.Client(project=project_id, database="grindolympiads")
        logging.info("Firestore initialized successfully.")
        return client, project_id
    except Exception as e:
        logging.error(f"Failed to initialize Firestore: {e}")
        print(f"❌ Failed to initialize Firestore: {e}")
        exit(1)


def load_json_data(filename):
    """Load JSON data from file."""
    try:
        with open(filename, "r") as f:
            data = json.load(f)
            logging.info(f"Loaded JSON data from {filename}.")
            return data
    except Exception as e:
        logging.error(f"Failed to load JSON file {filename}: {e}")
        print(f"❌ Failed to load JSON file {filename}: {e}")
        return []


def extract_image_details(html_content):
    """Extract image details from HTML content, prioritizing the main problem image."""
    soup = BeautifulSoup(html_content, "html.parser")

    # Look for an image with class 'latexcenter'
    main_image = soup.find("img", class_="latexcenter")
    if main_image:
        try:
            return [
                {
                    "src": main_image.get("src", ""),
                    "height": int(main_image.get("height", 0)),
                    "width": int(main_image.get("width", 0)),
                    "type": "main",
                }
            ]
        except ValueError:
            logging.warning("Non-integer dimensions found in main image.")
            return []

    # Fallback to other images
    images = soup.find_all("img")
    image_details = []
    for img in images:
        try:
            image_details.append(
                {
                    "src": img.get("src", ""),
                    "height": int(img.get("height", 0)),
                    "width": int(img.get("width", 0)),
                    "type": "other",
                }
            )
        except ValueError:
            logging.warning("Non-integer dimensions found in an image.")
            continue
    return image_details


def get_json_filename(year, exam_type):
    """Get the correct JSON filename based on year and exam type."""
    if exam_type == "AHSME":
        return f"cache/{year}_AHSME_Problems.json"
    else:
        return f"cache/{year}_{exam_type.replace('-', '_')}_Problems.json"


def compare_problem_images(db):
    """Compare image details in Firestore vs JSON files."""
    try:
        problems_ref = db.collection("problems")
        problems = problems_ref.stream()
    except Exception as e:
        logging.error(f"Failed to retrieve problems from Firestore: {e}")
        print(f"❌ Failed to retrieve problems from Firestore: {e}")
        return {}

    issues_by_year = defaultdict(list)
    json_cache = {}

    for problem in problems:
        problem_data = problem.to_dict()
        problem_id = problem.id
        known_as = problem_data.get("knownAs", "")
        if not known_as:
            issues_by_year[9999].append((problem_id, "Missing 'knownAs' field", None))
            logging.warning(f"Problem {problem_id}: Missing 'knownAs' field.")
            continue

        match = re.match(r"#(\d+) on the (\d{4}) (AMC-\d+[AB]?|AHSME)", known_as)
        if not match:
            issues_by_year[9999].append(
                (problem_id, f"Invalid 'knownAs' format: {known_as}", None)
            )
            logging.warning(
                f"Problem {problem_id}: Invalid 'knownAs' format: {known_as}."
            )
            continue

        problem_number, year, exam_type = match.groups()
        year = int(year)

        json_filename = get_json_filename(year, exam_type)

        if json_filename not in json_cache:
            if not os.path.exists(json_filename):
                issues_by_year[year].append(
                    (problem_id, f"JSON file not found: {json_filename}", None)
                )
                logging.warning(
                    f"Problem {problem_id}: JSON file not found: {json_filename}."
                )
                continue
            json_cache[json_filename] = load_json_data(json_filename)

        json_data = json_cache.get(json_filename, [])
        json_problem = next(
            (p for p in json_data if str(p.get("number")) == str(problem_number)), None
        )

        if not json_problem:
            issues_by_year[year].append(
                (problem_id, f"Not found in JSON file: {json_filename}", None)
            )
            logging.warning(
                f"Problem {problem_id}: Not found in JSON file: {json_filename}."
            )
            continue

        firestore_image = problem_data.get("details", {}).get("image", {})
        json_content = json_problem.get("content", "") + json_problem.get("options", "")
        json_images = extract_image_details(json_content)

        # Skip if no [asy] in JSON and no Firestore image
        if "[asy]" not in json_content and not firestore_image:
            issues_by_year[year].append((problem_id, "Nothing to do here.", None))
            logging.info(f"Problem {problem_id}: Nothing to do here.")
            continue

        if not firestore_image and not json_images:
            issues_by_year[year].append((problem_id, "Nothing to do here.", None))
            logging.info(f"Problem {problem_id}: Nothing to do here.")
        elif not firestore_image:
            issues_by_year[year].append(
                (problem_id, "No image data in Firestore.", json_problem)
            )
            logging.warning(f"Problem {problem_id}: No image data in Firestore.")
        elif not json_images:
            issues_by_year[year].append(
                (problem_id, "No image data in JSON file.", json_problem)
            )
            logging.warning(f"Problem {problem_id}: No image data in JSON file.")
        else:
            # Compare the first image in JSON with Firestore data
            json_image = json_images[0]
            if isinstance(firestore_image, dict):
                if (
                    firestore_image.get("width") != json_image["width"]
                    or firestore_image.get("height") != json_image["height"]
                ):
                    issue = (
                        f"Mismatch in image dimensions. "
                        f"Firestore: {firestore_image.get('width')}x{firestore_image.get('height')}, "
                        f"JSON: {json_image['width']}x{json_image['height']}"
                    )
                    issues_by_year[year].append((problem_id, issue, json_problem))
                    logging.info(f"Problem {problem_id}: {issue}")
            else:
                issues_by_year[year].append(
                    (
                        problem_id,
                        "Firestore image data is not a dictionary.",
                        json_problem,
                    )
                )
                logging.warning(
                    f"Problem {problem_id}: Firestore image data is not a dictionary."
                )

    return issues_by_year


def display_json_data(json_problem, problem_id, project_id):
    """Display relevant JSON data and Firestore link for the problem."""
    print("\nRelevant JSON data:")
    print(f"Problem number: {json_problem.get('number')}")
    print("Content:")
    print(json_problem.get("content"))
    print("Options:")
    print(json_problem.get("options"))
    print("\nExtracted image details:")
    json_content = json_problem.get("content", "") + json_problem.get("options", "")
    json_images = extract_image_details(json_content)
    for img in json_images:
        print(f"Type: {img['type']}")
        print(f"Source: {img['src']}")
        print(f"Dimensions: {img['width']}x{img['height']}")

    # Construct Firestore Document Link with /u/1
    firestore_link = f"https://console.firebase.google.com/u/1/project/{project_id}/firestore/databases/grindolympiads/data/~2Fproblems~2F{problem_id}"
    print(f"\nFirestore Document Link: {firestore_link}")


def update_firestore_image(db, problem_id, new_width, new_height):
    """Update Firestore image dimensions for a given problem."""
    try:
        problem_ref = db.collection("problems").document(problem_id)
        problem_ref.update(
            {"details.image.width": new_width, "details.image.height": new_height}
        )
        logging.info(
            f"Updated Firestore document '{problem_id}' with new dimensions: {new_width}x{new_height}"
        )
        print(
            f"✅ Updated Firestore document '{problem_id}' with new dimensions: {new_width}x{new_height}"
        )
    except Exception as e:
        logging.error(f"Failed to update Firestore document '{problem_id}': {e}")
        print(f"❌ Failed to update Firestore document '{problem_id}': {e}")


def main():
    db, project_id = initialize_firestore()
    issues_by_year = compare_problem_images(db)

    if issues_by_year:
        print("⚠️ Issues found:")
        for year in sorted(issues_by_year.keys()):
            print(f"\n📅 Year: {year}")
            for problem_id, issue, json_problem in issues_by_year[year]:
                print(f"\n🔍 Problem {problem_id}: {issue}")
                if "Mismatch in image dimensions" in issue and json_problem:
                    display_json_data(json_problem, problem_id, project_id)

                    # Automatically extract dimensions from JSON
                    json_content = json_problem.get("content", "") + json_problem.get(
                        "options", ""
                    )
                    json_images = extract_image_details(json_content)
                    if json_images:
                        json_image = json_images[0]
                        new_width = json_image["width"]
                        new_height = json_image["height"]

                        # Prompt to update
                        update_input = input(
                            "\nDo you want to update Firestore with JSON dimensions? (y/n): "
                        ).lower()
                        if update_input == "y":
                            update_firestore_image(
                                db, problem_id, new_width, new_height
                            )
                        else:
                            print("❌ Skipped updating this problem.")
                    else:
                        print("❌ No images found in JSON to update.")
                else:
                    print("Nothing to do here.")
    else:
        print(
            "✅ No issues found. All problem images match between Firestore and JSON files."
        )

    print("\n✅ Script completed.")
    logging.info("Script completed successfully.")


if __name__ == "__main__":
    main()
