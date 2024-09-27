from manifest import Manifest
from pytest_mock import MockFixture
from sync_state import File, SyncManager, SyncState


def test_get_local_files(mocker: MockFixture) -> None:
    mock_manifest = mocker.Mock(spec=Manifest)
    mock_manifest.files = []
    mock_manifest.rules = []
    mocker.patch("manifest.Manifest.load_from_file", return_value=mock_manifest)

    mock_state = mocker.Mock(spec=SyncState)
    mock_state.manifest = mock_manifest
    mock_state.files = {}
    mocker.patch("sync_state.SyncState", return_value=mock_state)

    sync_manager = SyncManager()

    mocker.patch(
        "os.walk",
        return_value=[
            (".", [], ["file1.py", "file2.js"]),
            ("./subdir", [], ["file3.ts"]),
        ],
    )
    mocker.patch("builtins.open", mocker.mock_open(read_data="file content"))

    sync_manager.get_local_files()

    assert len(sync_manager.state.files) == 3
    assert "file1.py" in sync_manager.state.files
    assert "subdir/file3.ts" in sync_manager.state.files


def test_fetch_remote_files(mocker: MockFixture) -> None:
    mock_manifest = mocker.Mock(spec=Manifest)
    mock_manifest.files = []
    mock_manifest.rules = []
    mocker.patch("manifest.Manifest.load_from_file", return_value=mock_manifest)

    mock_state = mocker.Mock(spec=SyncState)
    mock_state.manifest = mock_manifest
    mock_state.files = {}
    mocker.patch("sync_state.SyncState", return_value=mock_state)

    sync_manager = SyncManager()

    mock_curl_get = mocker.patch("sync_state.CurlGet")
    mock_curl_get.return_value.perform_request.return_value = (
        '[{"file_name": "remote_file.py", "content": "remote content", "uuid": "123"}]'
    )

    sync_manager.fetch_remote_files()

    assert len(sync_manager.state.files) == 1
    assert "remote_file.py" in sync_manager.state.files
    assert sync_manager.state.files["remote_file.py"].remote_uuid == "123"


def test_upload_file(mocker: MockFixture) -> None:
    mock_manifest = mocker.Mock(spec=Manifest)
    mock_manifest.files = []
    mock_manifest.rules = []
    mocker.patch("manifest.Manifest.load_from_file", return_value=mock_manifest)

    mock_state = mocker.Mock(spec=SyncState)
    mock_state.manifest = mock_manifest
    mock_state.files = {}
    mocker.patch("sync_state.SyncState", return_value=mock_state)

    sync_manager = SyncManager()

    mock_file = mocker.Mock(spec=File)
    mock_file.local_path = "test_file.py"
    mock_file.remote_path = "test_file.py"
    mock_file.local_contents = "test content"

    mock_curl_post = mocker.patch("sync_state.CurlPost")

    mocker.patch("builtins.open", mocker.mock_open(read_data="test content"))

    sync_manager.upload_file(mock_file)

    mock_curl_post.assert_called_once()
    mock_curl_post.return_value.perform_request.assert_called_once()


def test_remove_file(mocker: MockFixture) -> None:
    mock_manifest = mocker.Mock(spec=Manifest)
    mock_manifest.files = []
    mock_manifest.rules = []
    mocker.patch("manifest.Manifest.load_from_file", return_value=mock_manifest)

    mock_state = mocker.Mock(spec=SyncState)
    mock_state.manifest = mock_manifest
    mock_state.files = {}
    mocker.patch("sync_state.SyncState", return_value=mock_state)

    sync_manager = SyncManager()

    mock_file = mocker.Mock(spec=File)
    mock_file.remote_uuid = "123"
    mock_file.remote_path = "test_file.py"
    mock_file.local_path = "test_file.py"  # Add this line

    mock_curl_delete = mocker.patch("sync_state.CurlDelete")

    sync_manager.delete_file(mock_file)

    mock_curl_delete.assert_called_once_with("123")
    mock_curl_delete.return_value.perform_request.assert_called_once()


def test_show_unsynced_files(mocker: MockFixture) -> None:
    mock_manifest = mocker.Mock(spec=Manifest)
    mock_manifest.files = []
    mock_manifest.rules = []
    mocker.patch("manifest.Manifest.load_from_file", return_value=mock_manifest)

    mock_state = mocker.Mock(spec=SyncState)
    mock_state.manifest = mock_manifest
    mock_state.files = {
        "file1.py": mocker.Mock(is_fully_synced=False),
        "file2.py": mocker.Mock(is_fully_synced=True),
        "file3.py": mocker.Mock(is_fully_synced=False),
    }
    mocker.patch("sync_state.SyncState", return_value=mock_state)

    sync_manager = SyncManager()

    unsynced_files = sync_manager.show_unsynced_files()

    assert len(unsynced_files) == 2
    assert "file1.py" in unsynced_files
    assert "file3.py" in unsynced_files


def test_sync_files(mocker: MockFixture) -> None:
    mock_manifest = mocker.Mock(spec=Manifest)
    mock_manifest.files = []
    mock_manifest.rules = []
    mocker.patch("manifest.Manifest.load_from_file", return_value=mock_manifest)

    mock_state = mocker.Mock(spec=SyncState)
    mock_state.manifest = mock_manifest
    mock_state.files = {
        "file1.py": mocker.Mock(
            is_fully_synced=False, local_present=True, remote_present=False
        ),
        "file2.py": mocker.Mock(
            is_fully_synced=False, local_present=False, remote_present=True
        ),
        "file3.py": mocker.Mock(is_fully_synced=True),
    }
    mocker.patch("sync_state.SyncState", return_value=mock_state)

    sync_manager = SyncManager()

    mocker.patch.object(sync_manager, "upload_file")
    mocker.patch.object(sync_manager, "delete_file")

    sync_manager.sync_files()

    sync_manager.upload_file.assert_called_once()
    sync_manager.delete_file.assert_called_once()
