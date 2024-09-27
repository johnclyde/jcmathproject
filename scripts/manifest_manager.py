import json

from rich.console import Console
from rich.prompt import Prompt
from rich.table import Table

console = Console()


class ManifestManager:
    def __init__(self, file_manager):
        self.file_manager = file_manager
        self.manifest_file = self.file_manager.output_folder / "manifest.json"

    def load_manifest(self):
        if self.manifest_file.exists():
            with open(self.manifest_file, "r") as f:
                return json.load(f)
        return {}

    def save_manifest(self, manifest):
        with open(self.manifest_file, "w") as f:
            json.dump(manifest, f, indent=2)

    def get_injection_content(self):
        manifest = self.load_manifest()
        injection_content = ""
        for file_name, file_info in manifest.items():
            if file_info.get("inject_to_o1_mini", False):
                file_path = self.file_manager.output_folder / file_name
                if file_path.exists():
                    with open(file_path, "r") as f:
                        injection_content += f"\nContent of {file_name}:\n{f.read()}\n"
        return injection_content

    def manage_manifest(self):
        manifest = self.load_manifest()
        if not manifest:
            console.print("[yellow]No manifest items to manage.[/yellow]")
            return

        table = Table(title="Manifest Items")
        table.add_column("No.", justify="right", style="cyan", no_wrap=True)
        table.add_column("File Name", style="magenta")
        table.add_column("Description", style="green")
        table.add_column("Inject to o1-mini", style="yellow")

        items = list(manifest.items())
        for idx, (file_name, info) in enumerate(items, start=1):
            inject_status = "Yes" if info.get("inject_to_o1_mini", False) else "No"
            table.add_row(
                str(idx), file_name, info.get("description", ""), inject_status
            )

        console.print(table)

        while True:
            try:
                choice = Prompt.ask(
                    "Enter the number of the item you want to toggle (or type 'exit' to return)"
                )
                if choice.lower() == "exit":
                    break
                index = int(choice) - 1
                if index < 0 or index >= len(items):
                    console.print("[red]Invalid selection. Please try again.[/red]")
                    continue
                file_name, info = items[index]
                current_status = info.get("inject_to_o1_mini", False)
                new_status = not current_status
                manifest[file_name]["inject_to_o1_mini"] = new_status
                self.save_manifest(manifest)
                status_str = "enabled" if new_status else "disabled"
                console.print(
                    f"[blue]Inject to o1-mini has been [bold]{status_str}[/bold] for {file_name}.[/blue]"
                )
            except ValueError:
                console.print("[red]Please enter a valid number.[/red]")
            except Exception as e:
                console.print(f"[red]An error occurred: {e}[/red]")
                self.file_manager.log_interaction(f"Error in manage_manifest: {e}")
                break
