import json

from rich.console import Console

console = Console()


class ConversationManager:
    def __init__(self, api_client, file_manager, manifest_manager):
        self.api_client = api_client
        self.file_manager = file_manager
        self.manifest_manager = manifest_manager

    def start_conversation(self):
        console.print(
            "Start a conversation with the model (type '/menu' to manage manifest items, 'exit' to stop):"
        )
        while True:
            user_input = input("You: ")

            if user_input.lower() == "exit":
                console.print("Conversation ended.")
                break

            if user_input.lower() == "/menu":
                self.manifest_manager.manage_manifest()
                continue

            injection_content = self.manifest_manager.get_injection_content()

            o1_response = self._get_o1_response(user_input, injection_content)
            if o1_response is None:
                continue

            gpt4o_response = self._get_gpt4o_response(user_input, o1_response)
            if gpt4o_response is None:
                continue

            self._handle_gpt4o_response(gpt4o_response)

    def _get_o1_response(self, user_input, injection_content):
        o1_request = {
            "model": "o1-mini",
            "messages": [
                {
                    "role": "user",
                    "content": f"The following is content from previously generated files:\n{injection_content}.\n\nThe user says: {user_input}",
                },
            ],
            "stream": False,
        }
        o1_response = self.api_client.fetch_response(**o1_request)
        return o1_response.choices[0].message.content if o1_response else None

    def _get_gpt4o_response(self, user_input, o1_response):
        gpt4o_request = {
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an older GPT model with function call capabilities. Respond as if you were the newer model enhanced with these abilities.",
                },
                {
                    "role": "user",
                    "content": "I will not see your next response but the newer model will respond in your voice and tell you what to do in your subsequent message responding to my next request.",
                },
                {
                    "role": "assistant",
                    "content": f"(The user cannot see this response) {o1_response}",
                },
                {"role": "user", "content": user_input},
            ],
            "functions": [
                {
                    "name": "write_to_file",
                    "description": "Write content to a file in the ~/gpt-output/ folder",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "content": {
                                "type": "string",
                                "description": "The content to write to the file",
                            },
                            "description": {
                                "type": "string",
                                "description": "A brief description of the file content",
                            },
                        },
                        "required": ["content", "description"],
                    },
                }
            ],
            "stream": False,
        }
        return self.api_client.fetch_response(**gpt4o_request)

    def _handle_gpt4o_response(self, gpt4o_response):
        gpt4o_message = gpt4o_response.choices[0].message
        if hasattr(gpt4o_message, "function_call") and gpt4o_message.function_call:
            function_call = gpt4o_message.function_call
            if function_call.name == "write_to_file":
                try:
                    args = json.loads(function_call.arguments)
                    file_name = self.file_manager.write_to_file(
                        args["content"], args["description"]
                    )
                    console.print(
                        f"[blue]Model: Content has been written to file {file_name}.[/blue]"
                    )
                except Exception as e:
                    console.print(f"[red]Error executing function call: {e}[/red]")
        else:
            console.print(
                f"[magenta]Model: {gpt4o_message.content or 'No response from model.'}[/magenta]"
            )
