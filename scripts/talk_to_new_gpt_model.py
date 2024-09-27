import os

from rich.console import Console

from api_client import APIClient
from conversation_manager import ConversationManager
from file_manager import FileManager
from manifest_manager import ManifestManager

console = Console()


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set.")

    api_client = APIClient(api_key)
    file_manager = FileManager()
    manifest_manager = ManifestManager(file_manager)
    conversation_manager = ConversationManager(
        api_client, file_manager, manifest_manager
    )

    conversation_manager.start_conversation()


if __name__ == "__main__":
    main()
