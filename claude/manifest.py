import json
from dataclasses import dataclass


@dataclass
class Manifest:
    files: list[dict[str, str]]
    rules: list[dict[str, str]]

    @classmethod
    def load_from_file(cls, filename="manifest.json") -> "Manifest":
        with open(filename, "r") as f:
            data = json.load(f)
            files = data.get("files", [])
            rules = data.get("rules", [])
        return Manifest(files, rules)

    def save_to_file(self, filename="manifest.json") -> None:
        with open(filename, "w") as f:
            json.dump(self.__dict__, f, indent=2)

    def add_directory_match_rule(self, source: str, target: str) -> None:
        new_rule = {"type": "directory_match", "source": source, "target": target}
        self.rules.append(new_rule)

    def remove_directory_match_rule(self, source: str, target: str) -> None:
        self.rules = [
            rule
            for rule in self.state.manifest.rules
            if not (
                rule["type"] == "directory_match"
                and rule["source"] == source
                and rule["target"] == target
            )
        ]

    def get_directory_match_rules(self) -> list[dict[str, str]]:
        return [rule for rule in self.rules if rule["type"] == "directory_match"]
