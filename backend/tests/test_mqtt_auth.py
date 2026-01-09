"""Tests for MQTT authentication service."""
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.services.mqtt_auth import MQTTAuthService


@pytest.fixture
def temp_passwd_file():
    """Create a temporary password file for testing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        passwd_file = os.path.join(tmpdir, "passwd")
        yield passwd_file


def test_generate_credentials_returns_unique_values():
    """Test that generate_credentials returns unique username and password."""
    service = MQTTAuthService("/tmp/test_passwd")
    
    # Generate multiple credentials
    creds1 = service.generate_credentials()
    creds2 = service.generate_credentials()
    creds3 = service.generate_credentials()
    
    # All should be tuples of (username, password)
    assert isinstance(creds1, tuple)
    assert len(creds1) == 2
    
    # Usernames should be unique
    assert creds1[0] != creds2[0]
    assert creds2[0] != creds3[0]
    
    # Passwords should be unique
    assert creds1[1] != creds2[1]
    assert creds2[1] != creds3[1]
    
    # Usernames should follow pattern
    assert creds1[0].startswith("device_")
    assert creds2[0].startswith("device_")
    
    # Passwords should be non-empty
    assert len(creds1[1]) > 0
    assert len(creds2[1]) > 0


def test_password_file_created_if_not_exists(temp_passwd_file):
    """Test that password file is created on initialization."""
    # File should not exist yet
    assert not os.path.exists(temp_passwd_file)
    
    # Initialize service
    service = MQTTAuthService(temp_passwd_file)
    
    # File should now exist
    assert os.path.exists(temp_passwd_file)


@patch("subprocess.run")
def test_add_user_success(mock_run, temp_passwd_file):
    """Test adding a user to the password file."""
    # Mock successful mosquitto_passwd execution
    mock_run.return_value = MagicMock(returncode=0, stderr="", stdout="")

    service = MQTTAuthService(temp_passwd_file)

    # Add user
    service.add_user("test_user", "test_password")

    # Verify mosquitto_passwd was called (first call is add_user, second is reload)
    assert mock_run.call_count == 2
    # First call should be mosquitto_passwd
    call_args = mock_run.call_args_list[0][0][0]
    assert call_args[0] == "mosquitto_passwd"
    assert "-b" in call_args
    assert temp_passwd_file in call_args
    assert "test_user" in call_args
    assert "test_password" in call_args


@patch("subprocess.run")
def test_remove_user_success(mock_run, temp_passwd_file):
    """Test removing a user from the password file."""
    # Mock successful mosquitto_passwd execution
    mock_run.return_value = MagicMock(returncode=0, stderr="", stdout="")
    
    service = MQTTAuthService(temp_passwd_file)
    
    # Remove user
    service.remove_user("test_user")
    
    # Verify mosquitto_passwd was called correctly
    mock_run.assert_called_once()
    call_args = mock_run.call_args[0][0]
    assert call_args[0] == "mosquitto_passwd"
    assert "-D" in call_args
    assert temp_passwd_file in call_args
    assert "test_user" in call_args


@patch("subprocess.run")
def test_multiple_users_can_be_added(mock_run, temp_passwd_file):
    """Test that multiple users can be added to the password file."""
    # Mock successful mosquitto_passwd execution
    mock_run.return_value = MagicMock(returncode=0, stderr="", stdout="")

    service = MQTTAuthService(temp_passwd_file)

    # Add multiple users
    service.add_user("user1", "pass1")
    service.add_user("user2", "pass2")
    service.add_user("user3", "pass3")

    # Verify mosquitto_passwd was called 3 times (plus 3 reload calls = 6 total)
    assert mock_run.call_count == 6


@patch("subprocess.run")
def test_hash_password_mosquitto(mock_run, temp_passwd_file):
    """Test password hashing returns Mosquitto format."""
    # Mock mosquitto_passwd execution that writes to temp file
    def mock_subprocess(args, **kwargs):
        if args[0] == "mosquitto_passwd":
            temp_file = args[2]
            username = args[3]
            # Write a mock entry to the temp file
            with open(temp_file, "w") as f:
                f.write(f"{username}:$7$101$mockhashdata\n")
            return MagicMock(returncode=0, stderr="", stdout="")
    
    mock_run.side_effect = mock_subprocess
    
    service = MQTTAuthService(temp_passwd_file)
    
    # Hash a password
    hashed = service.hash_password_mosquitto("test_password")
    
    # Verify format
    assert hashed.startswith("$7$")


@patch("subprocess.run")
def test_add_user_handles_mosquitto_passwd_failure(mock_run, temp_passwd_file):
    """Test that add_user raises RuntimeError when mosquitto_passwd fails."""
    from subprocess import CalledProcessError
    
    # Mock failed mosquitto_passwd execution
    mock_run.side_effect = CalledProcessError(
        returncode=1,
        cmd="mosquitto_passwd",
        stderr="Error: something went wrong"
    )
    
    service = MQTTAuthService(temp_passwd_file)
    
    # Should raise RuntimeError
    with pytest.raises(RuntimeError, match="Failed to add user"):
        service.add_user("test_user", "test_password")


@patch("subprocess.run")
def test_remove_user_ignores_not_found_error(mock_run, temp_passwd_file):
    """Test that remove_user doesn't raise error if user not found."""
    from subprocess import CalledProcessError
    
    # Mock mosquitto_passwd returning "not found"
    mock_run.side_effect = CalledProcessError(
        returncode=1,
        cmd="mosquitto_passwd",
        stderr="Error: user not found"
    )
    
    service = MQTTAuthService(temp_passwd_file)
    
    # Should not raise error
    service.remove_user("nonexistent_user")


def test_reload_mosquitto_placeholder(temp_passwd_file):
    """Test that reload_mosquitto exists and can be called."""
    service = MQTTAuthService(temp_passwd_file)
    
    # Should not raise error (it's a placeholder)
    service.reload_mosquitto()
    service.reload_mosquitto(pid_file="/var/run/mosquitto.pid")
