from menu import Menu, MenuAction
from sync_state import File, SyncManager


class UploadFileMenu(Menu):
    def __init__(self, sync_manager: SyncManager) -> None:
        super().__init__("Upload File")
        self.sync_manager = sync_manager

    def update_options(self) -> None:
        self.options.clear()
        local_only_files = sorted(
            [
                file
                for file in self.sync_manager.state.files.values()
                if file.local_present and not file.remote_present
            ],
            key=lambda f: f.local_path,
        )

        for file in local_only_files:
            self.add_option(UploadFileOption(file, self.sync_manager))


class UploadFileOption(Menu):
    def __init__(self, file: File, sync_manager: SyncManager) -> None:
        super().__init__(file.local_path)
        self.file = file
        self.sync_manager = sync_manager

    def run(self) -> MenuAction:
        self.sync_manager.upload_file(self.file)
        return MenuAction.CONTINUE
