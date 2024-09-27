from menu import Menu, MenuAction, MenuOption
from sync_state import SyncManager


class ManifestMenu(Menu):
    def __init__(self, sync_manager: SyncManager) -> None:
        super().__init__("Manifest Settings")
        self.sync_manager = sync_manager

    def update_options(self) -> None:
        self.options.clear()
        self.add_option(ShowManifestOption(self.sync_manager))
        self.add_option(UploadManifestOption(self.sync_manager))
        self.add_option(SaveManifestOption(self.sync_manager))
        self.add_option(IgnoreMissingRemotesMenu(self.sync_manager))
        self.add_option(AddDirectoryMatchRuleOption(self.sync_manager))
        self.add_option(RemoveDirectoryMatchRuleOption(self.sync_manager))


class ShowManifestOption(MenuOption):
    def __init__(self, sync_manager: SyncManager) -> None:
        super().__init__("Show manifest")
        self.sync_manager = sync_manager

    def run(self) -> MenuAction:
        manifest = self.sync_manager.state.manifest
        print("\nManifest:")
        for file in sorted(manifest.files, key=lambda f: f["path"]):
            print(f"{file['status']}: {file['path']}")
        for rule in manifest.rules:
            print(f"Rule: {rule}")
        return MenuAction.CONTINUE


class UploadManifestOption(MenuOption):
    def __init__(self, sync_manager: SyncManager) -> None:
        super().__init__("Upload manifest")
        self.sync_manager = sync_manager

    def run(self) -> MenuAction:
        self.sync_manager.upload_manifest()
        return MenuAction.CONTINUE


class SaveManifestOption(MenuOption):
    def __init__(self, sync_manager: SyncManager) -> None:
        super().__init__("Save manifest")
        self.sync_manager = sync_manager

    def run(self) -> MenuAction:
        self.sync_manager.save_manifest()
        return MenuAction.CONTINUE


class IgnoreMissingRemotesMenu(Menu):
    def __init__(self, sync_manager: SyncManager) -> None:
        super().__init__("Manage Ignore Missing Remotes")
        self.sync_manager = sync_manager

    def update_options(self) -> None:
        self.options.clear()
        self.add_option(AddIgnoreMissingRemotesOption(self.sync_manager))
        self.add_option(RemoveIgnoreMissingRemotesOption(self.sync_manager))
        self.add_option(ListIgnoreMissingRemotesOption(self.sync_manager))


class AddIgnoreMissingRemotesOption(MenuOption):
    def __init__(self, sync_manager: SyncManager) -> None:
        super().__init__("Add file to ignore missing remotes")
        self.sync_manager = sync_manager

    def run(self) -> MenuAction:
        file_path = input("Enter the file path to ignore missing remotes: ")
        self.sync_manager.add_ignore_missing_remotes(file_path)
        print(f"Added {file_path} to ignore missing remotes list.")
        return MenuAction.CONTINUE


class RemoveIgnoreMissingRemotesOption(MenuOption):
    def __init__(self, sync_manager: SyncManager) -> None:
        super().__init__("Remove file from ignore missing remotes")
        self.sync_manager = sync_manager

    def run(self) -> MenuAction:
        file_path = input("Enter the file path to remove from ignore missing remotes: ")
        self.sync_manager.remove_ignore_missing_remotes(file_path)
        print(f"Removed {file_path} from ignore missing remotes list.")
        return MenuAction.CONTINUE


class ListIgnoreMissingRemotesOption(MenuOption):
    def __init__(self, sync_manager: SyncManager) -> None:
        super().__init__("List files ignoring missing remotes")
        self.sync_manager = sync_manager

    def run(self) -> MenuAction:
        ignored_files = self.sync_manager.get_ignore_missing_remotes()
        if ignored_files:
            print("Files ignoring missing remotes:")
            for file in ignored_files:
                print(f"- {file}")
        else:
            print("No files are currently ignoring missing remotes.")
        return MenuAction.CONTINUE


class AddDirectoryMatchRuleOption(MenuOption):
    def __init__(self, sync_manager: SyncManager) -> None:
        super().__init__("Add directory match rule")
        self.sync_manager = sync_manager

    def run(self) -> MenuAction:
        source = input("Enter source directory: ")
        target = input("Enter target directory: ")
        self.sync_manager.add_directory_match_rule(source, target)
        print(f"Added directory match rule: {source} -> {target}")
        return MenuAction.CONTINUE


class RemoveDirectoryMatchRuleOption(MenuOption):
    def __init__(self, sync_manager: SyncManager) -> None:
        super().__init__("Remove directory match rule")
        self.sync_manager = sync_manager

    def run(self) -> MenuAction:
        rules = self.sync_manager.get_directory_match_rules()
        if not rules:
            print("No directory match rules to remove.")
            return MenuAction.CONTINUE

        print("Current directory match rules:")
        for i, rule in enumerate(rules):
            print(f"{i + 1}. {rule['source']} -> {rule['target']}")

        choice = input("Enter the number of the rule to remove (or 0 to cancel): ")
        try:
            choice = int(choice)
            if 1 <= choice <= len(rules):
                removed_rule = rules[choice - 1]
                self.sync_manager.remove_directory_match_rule(
                    removed_rule["source"], removed_rule["target"]
                )
                print(
                    f"Removed directory match rule: {removed_rule['source']} -> {removed_rule['target']}"
                )
            elif choice != 0:
                print("Invalid choice. No rule removed.")
        except ValueError:
            print("Invalid input. No rule removed.")

        return MenuAction.CONTINUE
