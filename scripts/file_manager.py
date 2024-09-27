import os
from pathlib import Path


class FileManager:
    def __init__(self):
        self.output_folder = Path(os.path.expanduser("~/gpt-output/"))
        self.output_folder.mkdir(parents=True, exist_ok=True)
        self.log_file = self.output_folder / "interaction.log"

    def write_to_file(self, content, description=""):
        output_file = self._get_unique_filename()
        with open(output_file, "w") as f:
            f.write(content)
        return output_file.name

    def _get_unique_filename(self, base_name="gpt_output", extension=".txt"):
        index = 1
        while True:
            file_name = f"{base_name}_{index}{extension}"
            file_path = self.output_folder / file_name
            if not file_path.exists():
                return file_path
            index += 1

    def log_interaction(self, message):
        with open(self.log_file, "a") as f:
            f.write(message + "\n")
