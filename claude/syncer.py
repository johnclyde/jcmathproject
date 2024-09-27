from main_menu import MainMenu
from sync_state import SyncManager


def main() -> None:
    sync_manager = SyncManager()
    main_menu = MainMenu(sync_manager)
    main_menu.run()


if __name__ == "__main__":
    main()
