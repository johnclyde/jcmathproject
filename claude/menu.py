from abc import abstractmethod
from enum import Enum, auto


class MenuAction(Enum):
    CONTINUE = auto()
    BACK = auto()
    TASK_COMPLETE = auto()
    EXIT = auto()


class MenuOption:
    def __init__(self, label: str) -> None:
        self.label = label

    @abstractmethod
    def run(self) -> MenuAction:
        pass


class Menu(MenuOption):
    def __init__(self, label: str) -> None:
        super().__init__(label)
        self.options: list[MenuOption] = []

    def add_option(self, option: MenuOption) -> None:
        self.options.append(option)

    def display(self) -> None:
        print(f"\n{self.label}")
        for index, option in enumerate(self.options, 1):
            print(f"{index}. {option.label}")
        print("0. Back")

    def run(self) -> MenuAction:
        while True:
            self.update_options()
            self.display()
            choice = input("Enter your choice: ")
            if choice == "0":
                return MenuAction.BACK
            try:
                choice = int(choice) - 1
                if 0 <= choice < len(self.options):
                    result = self.options[choice].run()
                    if result != MenuAction.CONTINUE:
                        return result
                else:
                    print("Invalid choice. Please try again.")
            except ValueError:
                print("Invalid input. Please enter a number.")

    @abstractmethod
    def update_options(self) -> None:
        pass


class TaskMenu(Menu):
    def run(self) -> MenuAction:
        while True:
            self.update_options()
            self.display()
            choice = input("Enter your choice: ")
            if choice == "0":
                return MenuAction.BACK
            try:
                choice = int(choice) - 1
                if 0 <= choice < len(self.options):
                    result = self.options[choice].run()
                    if result == MenuAction.TASK_COMPLETE:
                        print("Task completed. Returning to previous menu.")
                        return MenuAction.BACK
                    elif result == MenuAction.BACK:
                        return MenuAction.BACK
                    elif result == MenuAction.EXIT:
                        return MenuAction.EXIT
                else:
                    print("Invalid choice. Please try again.")
            except ValueError:
                print("Invalid input. Please enter a number.")
