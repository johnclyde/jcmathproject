from menu import Menu, MenuAction, MenuOption, TaskMenu
from pytest_mock import MockFixture
from sync_state import File, SyncManager
from view_file_diff_menu import OverwriteRemote, ViewFileDiffMenu, ViewFileDiffOption


class TestMenuOption(MenuOption):
    def __init__(self, label: str, return_value: MenuAction):
        super().__init__(label)
        self.return_value = return_value

    def run(self) -> MenuAction:
        return self.return_value


class TestMenu(Menu):
    def update_options(self) -> None:
        pass


class TestTaskMenu(TaskMenu):
    def update_options(self) -> None:
        pass


def test_menu_navigation(mocker: MockFixture) -> None:
    main_menu = TestMenu("Main Menu")
    sub_menu = TestMenu("Sub Menu")
    main_menu.add_option(sub_menu)
    sub_menu.add_option(TestMenuOption("Test Option", MenuAction.CONTINUE))

    mocker.patch("builtins.input", side_effect=["1", "1", "0", "0"])
    result = main_menu.run()

    assert result == MenuAction.BACK


def test_task_completion(mocker: MockFixture) -> None:
    task_menu = TestTaskMenu("Task Menu")
    task_menu.add_option(TestMenuOption("Complete Task", MenuAction.TASK_COMPLETE))

    mocker.patch("builtins.input", side_effect=["1"])
    result = task_menu.run()

    assert result == MenuAction.BACK


def test_overwrite_remote(mocker: MockFixture) -> None:
    sync_manager = mocker.Mock(spec=SyncManager)
    file = mocker.Mock(spec=File)
    file.remote_path = "test_file.txt"

    overwrite_option = OverwriteRemote(file, sync_manager)

    mocker.patch("builtins.input", return_value="y")
    result = overwrite_option.run()

    assert result == MenuAction.TASK_COMPLETE
    sync_manager.delete_file.assert_called_once_with(file)
    sync_manager.upload_file.assert_called_once_with(file)


def test_view_file_diff_option(mocker: MockFixture) -> None:
    sync_manager = mocker.Mock(spec=SyncManager)
    file = mocker.Mock(spec=File)
    file.local_path = "test_file.txt"
    file.remote_path = "test_file.txt"

    view_diff_option = ViewFileDiffOption(file, sync_manager)

    mocker.patch("builtins.input", side_effect=["2", "y"])
    result = view_diff_option.run()

    assert result == MenuAction.BACK


def test_view_file_diff_menu(mocker: MockFixture) -> None:
    sync_manager = mocker.Mock(spec=SyncManager)
    file1 = mocker.Mock(spec=File)
    file1.is_fully_synced = False
    file1.local_path = "file1.txt"
    file1.remote_path = "file1.txt"
    file2 = mocker.Mock(spec=File)
    file2.is_fully_synced = False
    file2.local_path = "file2.txt"
    file2.remote_path = "file2.txt"

    sync_manager.state = mocker.Mock()
    sync_manager.state.files = mocker.Mock()
    sync_manager.state.files.values.return_value = [file1, file2]

    view_diff_menu = ViewFileDiffMenu(sync_manager)

    mocker.patch("builtins.input", side_effect=["1", "2", "y", "0"])
    result = view_diff_menu.run()

    assert result == MenuAction.BACK
    assert sync_manager.state.files.values.call_count == 1


def test_menu_exit(mocker: MockFixture) -> None:
    main_menu = TestMenu("Main Menu")
    main_menu.add_option(TestMenuOption("Exit Option", MenuAction.EXIT))

    mocker.patch("builtins.input", side_effect=["1"])
    result = main_menu.run()

    assert result == MenuAction.EXIT


def test_invalid_input_handling(mocker: MockFixture) -> None:
    menu = TestMenu("Test Menu")
    menu.add_option(TestMenuOption("Valid Option", MenuAction.CONTINUE))

    mocker.patch("builtins.input", side_effect=["invalid", "2", "1", "0"])
    mock_print = mocker.patch("builtins.print")
    result = menu.run()

    assert result == MenuAction.BACK
    mock_print.assert_any_call("Invalid input. Please enter a number.")
    mock_print.assert_any_call("Invalid choice. Please try again.")
