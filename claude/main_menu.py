from delete_menu import DeleteMenu
from file_list_menu import FileListMenu
from manifest_menu import ManifestMenu
from menu import Menu, MenuAction, MenuOption
from sync_state import SyncManager


class MainMenu(Menu):
    def __init__(self, sync_manager: SyncManager) -> None:
        super().__init__("File Synchronization Menu")
        self.sync_manager = sync_manager

    def update_options(self) -> None:
        self.options.clear()
        option = FetchRemoteOption(self.sync_manager, "Refresh remotes")
        if not self.sync_manager.state.fetched:
            option.run()
        self.add_option(FileListMenu(self.sync_manager))
        self.add_option(DeleteMenu(self.sync_manager))
        self.add_option(ManifestMenu(self.sync_manager))
        self.add_option(option)


class FetchRemoteOption(MenuOption):
    def __init__(self, sync_manager: SyncManager, label: str) -> None:
        super().__init__(label)
        self.sync_manager = sync_manager

    def run(self) -> MenuAction:
        print("Fetching remote files...")
        self.sync_manager.fetch_and_compare()
        print("Remote files fetched successfully.")
        return MenuAction.CONTINUE
