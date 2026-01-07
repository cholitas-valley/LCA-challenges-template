"""Encryption service for sensitive data."""
import base64

from cryptography.fernet import Fernet


class EncryptionService:
    """Service for encrypting and decrypting sensitive data."""

    def __init__(self, key: str):
        """
        Initialize encryption service.

        Args:
            key: Encryption key (32-byte string or base64 URL-safe encoded key)
        """
        try:
            # Try to use the key as-is (might be base64 URL-safe already)
            key_bytes = key.encode('utf-8')
            Fernet(key_bytes)  # Test if valid
            self.fernet = Fernet(key_bytes)
        except Exception:
            # If not valid base64, convert plain 32-char string to Fernet key
            # Fernet requires a 32-byte key that's base64 URL-safe encoded
            if len(key) >= 32:
                # Take first 32 bytes, encode to base64 URL-safe
                key_bytes = base64.urlsafe_b64encode(key[:32].encode('utf-8'))
            else:
                # Pad the key to 32 bytes
                padded = key.ljust(32, '!')
                key_bytes = base64.urlsafe_b64encode(padded.encode('utf-8'))
            self.fernet = Fernet(key_bytes)

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt string and return base64 encoded ciphertext.

        Args:
            plaintext: String to encrypt

        Returns:
            Base64 encoded ciphertext
        """
        encrypted_bytes = self.fernet.encrypt(plaintext.encode('utf-8'))
        return encrypted_bytes.decode('utf-8')

    def decrypt(self, ciphertext: str | bytes) -> str:
        """
        Decrypt base64 encoded ciphertext.

        Args:
            ciphertext: Base64 encoded ciphertext (string or bytes)

        Returns:
            Decrypted plaintext string
        """
        # Handle both string and bytes input
        if isinstance(ciphertext, str):
            ciphertext_bytes = ciphertext.encode('utf-8')
        else:
            ciphertext_bytes = ciphertext

        decrypted_bytes = self.fernet.decrypt(ciphertext_bytes)
        return decrypted_bytes.decode('utf-8')
