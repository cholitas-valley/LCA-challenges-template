---
task_id: task-005
title: MQTT credential generation and password file
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-004
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-004.md
allowed_paths:
  - backend/**
  - mosquitto/**
check_command: cd backend && python -m pytest tests/test_mqtt_auth.py -v --tb=short
handoff: runs/handoffs/task-005.md
---

# Task 005: MQTT Credential Generation and Password File

## Goal

Create the MQTT authentication service that generates secure credentials and manages the Mosquitto password file. This enables devices to authenticate with the MQTT broker.

## Requirements

### MQTT Auth Service (backend/src/services/mqtt_auth.py)

```python
class MQTTAuthService:
    def __init__(self, passwd_file_path: str):
        self.passwd_file_path = passwd_file_path
    
    def generate_credentials(self) -> tuple[str, str]:
        """Generate unique username and secure password."""
        
    def hash_password_mosquitto(self, password: str) -> str:
        """Hash password in Mosquitto password_file format."""
        
    def add_user(self, username: str, password: str) -> None:
        """Add user to Mosquitto password file."""
        
    def remove_user(self, username: str) -> None:
        """Remove user from Mosquitto password file."""
        
    def reload_mosquitto(self) -> None:
        """Send SIGHUP to Mosquitto to reload password file."""
```

### Mosquitto Password File Format

The password file uses the format:
```
username:$7$hash_data
```

For compatibility, use the `mosquitto_passwd` tool or implement PBKDF2-SHA512 hashing:
- Salt: 12 bytes random
- Iterations: 101 (Mosquitto default)
- Hash: PBKDF2-SHA512

Alternative: Use `passlib` with the mosquitto hash format or shell out to `mosquitto_passwd`.

### Integration with Device Registration

Update device registration (task-004) to:
1. Call `MQTTAuthService.generate_credentials()` 
2. Add user to password file via `add_user()`
3. Call `reload_mosquitto()` (optional, can be deferred)

### Configuration

Add to Settings:
```python
mqtt_passwd_file: str = "/mosquitto/passwd"
```

### Tests (backend/tests/test_mqtt_auth.py)

Test cases:
- Generate credentials returns unique username/password
- Password file is created if not exists
- User added to password file in correct format
- User removed from password file
- Multiple users can be added

## Definition of Done

- [ ] MQTTAuthService class exists with all methods
- [ ] Credentials use secure random generation
- [ ] Password file written in Mosquitto-compatible format
- [ ] User can be added and removed from password file
- [ ] Integration with device registration (password file updated on register)
- [ ] All tests pass

## Constraints

- Do NOT start Mosquitto or test actual MQTT connections
- Password file path configurable via environment
- Handle file locking for concurrent writes
- Password file must be readable by Mosquitto container

## Notes

Mosquitto password file format options:
1. Use `mosquitto_passwd -b` command (requires mosquitto-clients installed)
2. Implement PBKDF2-SHA512 directly (complex but no dependencies)
3. Use passlib with custom Mosquitto hasher

Recommend option 1 (shelling out to mosquitto_passwd) for simplicity.
