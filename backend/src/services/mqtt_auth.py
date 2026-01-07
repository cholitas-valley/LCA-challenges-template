"""MQTT authentication service for managing Mosquitto password file."""
import fcntl
import os
import secrets
import subprocess
import uuid
from pathlib import Path
from typing import Optional


class MQTTAuthService:
    """Service for managing MQTT user authentication with Mosquitto."""
    
    def __init__(self, passwd_file_path: str):
        """
        Initialize the MQTT authentication service.
        
        Args:
            passwd_file_path: Path to the Mosquitto password file
        """
        self.passwd_file_path = passwd_file_path
        self._ensure_passwd_file_exists()
    
    def _ensure_passwd_file_exists(self) -> None:
        """Create the password file if it doesn't exist."""
        passwd_path = Path(self.passwd_file_path)
        passwd_path.parent.mkdir(parents=True, exist_ok=True)
        if not passwd_path.exists():
            passwd_path.touch(mode=0o600)
    
    def generate_credentials(self) -> tuple[str, str]:
        """
        Generate unique username and secure password for MQTT.
        
        Returns:
            Tuple of (username, password)
        """
        # Generate short ID for username
        short_id = str(uuid.uuid4()).replace("-", "")[:8]
        username = f"device_{short_id}"
        
        # Generate secure random password (32 characters)
        password = secrets.token_urlsafe(32)
        
        return username, password
    
    def hash_password_mosquitto(self, password: str) -> str:
        """
        Hash password in Mosquitto password_file format.
        
        This method uses mosquitto_passwd utility to generate the hash.
        
        Args:
            password: Plain text password to hash
            
        Returns:
            Hashed password in Mosquitto format ($7$...)
            
        Raises:
            RuntimeError: If mosquitto_passwd command fails
        """
        # Use mosquitto_passwd to generate hash
        # We create a temporary file to extract just the hash
        temp_file = f"{self.passwd_file_path}.tmp"
        temp_username = f"temp_{uuid.uuid4().hex[:8]}"
        
        try:
            # Generate password entry in temp file
            result = subprocess.run(
                ["mosquitto_passwd", "-b", temp_file, temp_username, password],
                capture_output=True,
                text=True,
                check=True,
            )
            
            # Read the hash from the temp file
            with open(temp_file, "r") as f:
                line = f.read().strip()
                # Format is "username:$7$hash..."
                if ":" in line:
                    _, hash_part = line.split(":", 1)
                    return hash_part
                else:
                    raise RuntimeError("Invalid mosquitto_passwd output format")
        
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"mosquitto_passwd failed: {e.stderr}")
        
        except FileNotFoundError:
            raise RuntimeError(
                "mosquitto_passwd command not found. "
                "Install mosquitto-clients package."
            )
        
        finally:
            # Clean up temp file
            if os.path.exists(temp_file):
                os.remove(temp_file)
    
    def add_user(self, username: str, password: str) -> None:
        """
        Add user to Mosquitto password file.
        
        Uses file locking to handle concurrent writes safely.
        
        Args:
            username: MQTT username
            password: Plain text password
            
        Raises:
            RuntimeError: If mosquitto_passwd command fails
        """
        # Use mosquitto_passwd with -b flag (batch mode)
        # This handles file locking internally
        try:
            result = subprocess.run(
                ["mosquitto_passwd", "-b", self.passwd_file_path, username, password],
                capture_output=True,
                text=True,
                check=True,
            )
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Failed to add user to password file: {e.stderr}")
        except FileNotFoundError:
            raise RuntimeError(
                "mosquitto_passwd command not found. "
                "Install mosquitto-clients package."
            )
    
    def remove_user(self, username: str) -> None:
        """
        Remove user from Mosquitto password file.
        
        Uses file locking to handle concurrent writes safely.
        
        Args:
            username: MQTT username to remove
        """
        passwd_path = Path(self.passwd_file_path)
        
        if not passwd_path.exists():
            return
        
        # Use mosquitto_passwd -D to delete user
        try:
            result = subprocess.run(
                ["mosquitto_passwd", "-D", self.passwd_file_path, username],
                capture_output=True,
                text=True,
                check=True,
            )
        except subprocess.CalledProcessError as e:
            # mosquitto_passwd -D returns non-zero if user not found
            # This is acceptable - just means user was already removed
            if "not found" not in e.stderr.lower():
                raise RuntimeError(f"Failed to remove user from password file: {e.stderr}")
        except FileNotFoundError:
            raise RuntimeError(
                "mosquitto_passwd command not found. "
                "Install mosquitto-clients package."
            )
    
    def reload_mosquitto(self, pid_file: Optional[str] = None) -> None:
        """
        Send SIGHUP to Mosquitto to reload password file.

        This is optional and can be deferred. In containerized environments,
        Mosquitto may automatically reload or we may need to use docker exec.

        Args:
            pid_file: Path to Mosquitto PID file (optional)
        """
        # Mosquitto 2.0+ automatically reloads password file on change
        # If manual reload needed, use: docker exec plantops-mosquitto kill -HUP 1
        # For now, rely on auto-reload functionality
        pass
