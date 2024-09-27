import json
import os
from abc import ABC, abstractmethod
from io import BytesIO

import pycurl
from dotenv import load_dotenv

load_dotenv()


class CurlHelper(ABC):
    def __init__(self):
        self.domain: str = os.getenv("DOMAIN", "")
        self.organization: str = os.getenv("ORGANIZATION", "")
        self.project: str = os.getenv("PROJECT", "")
        self.session_key: str = os.getenv("SESSION_KEY", "")
        self.user_agent: str = (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        )

    def _get_base_url(self) -> str:
        return f"{self.domain}/api/organizations/{self.organization}/projects/{self.project}/docs"

    def _get_base_headers(self) -> list[str]:
        return [
            f"cookie: sessionKey={self.session_key}",
            f"user-agent: {self.user_agent}",
        ]

    @abstractmethod
    def perform_request(self) -> str:
        pass


class CurlGet(CurlHelper):
    def perform_request(self) -> str:
        buffer = BytesIO()
        c = pycurl.Curl()
        c.setopt(c.URL, self._get_base_url())
        c.setopt(c.HTTPHEADER, self._get_base_headers())
        c.setopt(c.WRITEDATA, buffer)
        c.perform()

        status_code = c.getinfo(pycurl.HTTP_CODE)
        c.close()

        response = buffer.getvalue().decode("utf-8")

        if status_code >= 400:
            raise Exception(f"HTTP Error {status_code}: {response}")

        return response


class CurlPost(CurlHelper):
    def __init__(self, file_name: str, content: str):
        super().__init__()
        self.file_name = file_name
        self.content = content

    def perform_request(self) -> str:
        buffer = BytesIO()
        c = pycurl.Curl()
        c.setopt(c.URL, self._get_base_url())
        c.setopt(c.POST, 1)
        c.setopt(
            c.HTTPHEADER, self._get_base_headers() + ["content-type: application/json"]
        )
        data = json.dumps({"file_name": self.file_name, "content": self.content})
        c.setopt(c.POSTFIELDS, data)
        c.setopt(c.WRITEDATA, buffer)
        c.perform()

        status_code = c.getinfo(pycurl.HTTP_CODE)
        c.close()

        response = buffer.getvalue().decode("utf-8")

        if status_code >= 400:
            raise Exception(f"HTTP Error {status_code}: {response}")

        return response


class CurlDelete(CurlHelper):
    def __init__(self, doc_uuid: str):
        super().__init__()
        self.doc_uuid = doc_uuid

    def perform_request(self) -> str:
        buffer = BytesIO()
        c = pycurl.Curl()
        c.setopt(c.URL, f"{self._get_base_url()}/{self.doc_uuid}")
        c.setopt(c.CUSTOMREQUEST, "DELETE")
        c.setopt(
            c.HTTPHEADER, self._get_base_headers() + ["content-type: application/json"]
        )
        data = json.dumps({"docUuid": self.doc_uuid})
        c.setopt(c.POSTFIELDS, data)
        c.setopt(c.WRITEDATA, buffer)
        c.perform()

        status_code = c.getinfo(pycurl.HTTP_CODE)
        c.close()

        response = buffer.getvalue().decode("utf-8")

        if status_code >= 400:
            raise Exception(f"HTTP Error {status_code}: {response}")

        return response
