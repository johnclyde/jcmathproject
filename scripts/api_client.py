from openai import Client
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

console = Console()


class APIClient:
    def __init__(self, api_key):
        self.client = Client(api_key=api_key)

    def fetch_response(self, model, messages, functions=None, stream=False):
        try:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                transient=True,
                console=console,
            ) as progress:
                task = progress.add_task(
                    description="Processing your request...", total=None
                )
                if functions:
                    response = self.client.chat.completions.create(
                        model=model,
                        messages=messages,
                        functions=functions,
                        stream=stream,
                    )
                else:
                    response = self.client.chat.completions.create(
                        model=model, messages=messages, stream=stream
                    )
                progress.stop()
            return response
        except Exception as e:
            error_message = f"An error occurred: {e}"
            console.print(f"[red]{error_message}[/red]")
            return None
