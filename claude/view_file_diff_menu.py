import difflib

from menu import Menu, MenuAction, MenuOption, TaskMenu
from sync_state import File, SyncManager


class ViewFileDiffMenu(Menu):
    def __init__(self, sync_manager: SyncManager) -> None:
        super().__init__("View File Diff")
        self.sync_manager = sync_manager

    def update_options(self) -> None:
        self.options.clear()
        unsynced_files = sorted(
            [
                file
                for file in self.sync_manager.state.files.values()
                if not file.is_fully_synced
            ],
            key=lambda f: f.local_path,
        )
        for file in unsynced_files:
            self.add_option(ViewFileDiffOption(file, self.sync_manager))

    def run(self) -> MenuAction:
        while True:
            result = super().run()
            if result == MenuAction.BACK:
                return MenuAction.BACK
            elif result == MenuAction.EXIT:
                return MenuAction.EXIT
            # If we get here, it means a task was completed, so we should refresh the options
            self.update_options()
            if not self.options:
                print("No more unsynced files. Returning to previous menu.")
                return MenuAction.BACK


class ViewFileDiffOption(TaskMenu):
    def __init__(self, file: File, sync_manager: SyncManager) -> None:
        super().__init__(file.local_path)
        self.file = file
        self.sync_manager = sync_manager

    def update_options(self) -> None:
        self.options.clear()
        display_diff = DisplayDiff(self.file)
        display_diff.run()
        self.add_option(OverwriteRemote(self.file, self.sync_manager))
        self.add_option(DisplayDiff(self.file))


class DisplayDiff(Menu):
    def __init__(self, file: File) -> None:
        super().__init__("Display Diff")
        self.file = file

    def run(self) -> MenuAction:
        if not self.file.local_present:
            print(f"\nFile only exists remotely: {self.file.remote_path}")
            return

        if not self.file.remote_present:
            print(f"\nFile only exists locally: {self.file.local_path}")
            return

        local_lines = self.file.local_contents.splitlines(keepends=True)
        remote_lines = self.file.remote_contents.splitlines(keepends=True)

        diff = difflib.unified_diff(
            remote_lines,
            local_lines,
            fromfile=f"{self.file.remote_path} (remote)",
            tofile=f"{self.file.local_path} (local)",
            lineterm="",
        )

        print("\nFile diff:")
        print("".join(diff))
        return MenuAction.CONTINUE


class OverwriteRemote(MenuOption):
    def __init__(self, file: File, sync_manager: SyncManager) -> None:
        super().__init__("Overwrite Remote File")
        self.file = file
        self.sync_manager = sync_manager

    def run(self) -> MenuAction:
        confirm = input(
            f"Are you sure you want to overwrite the remote file '{self.file.remote_path}'? (y/n): "
        )
        if confirm.lower() == "y":
            try:
                self.sync_manager.delete_file(self.file)
                print(f"Removed file '{self.file.remote_path}' from remotes.")
                self.sync_manager.upload_file(self.file)
                print(f"Uploaded new version of file '{self.file.remote_path}'.")
                return MenuAction.TASK_COMPLETE
            except Exception as e:
                print(f"Error overwriting remote file: {e}")
        else:
            print("Overwrite cancelled.")
        return MenuAction.CONTINUE
