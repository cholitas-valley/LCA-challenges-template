## Review: task-005
Status: APPROVED

### Tests: 9 passing, properly validate behavior

**MQTT Auth Service Tests (test_mqtt_auth.py):**
- `test_generate_credentials_returns_unique_values`: Validates uniqueness across multiple generations, checks format (device_ prefix), and non-empty passwords
- `test_password_file_created_if_not_exists`: Confirms file creation behavior
- `test_add_user_success`: Verifies correct mosquitto_passwd invocation with -b flag
- `test_remove_user_success`: Verifies correct mosquitto_passwd invocation with -D flag
- `test_multiple_users_can_be_added`: Confirms idempotent operations
- `test_hash_password_mosquitto`: Validates Mosquitto hash format ($7$)
- `test_add_user_handles_mosquitto_passwd_failure`: Error handling coverage
- `test_remove_user_ignores_not_found_error`: Graceful handling of missing users
- `test_reload_mosquitto_placeholder`: Confirms API surface

**Device Integration Tests (test_devices.py):**
- Updated to properly mock MQTT auth service
- Verifies `add_user` called on registration (line 51)
- Verifies `remove_user` called on deletion (line 244)

### DoD: All items met

1. [x] MQTTAuthService class exists with all methods - `backend/src/services/mqtt_auth.py`
2. [x] Credentials use secure random generation - Uses `secrets.token_urlsafe(32)` (line 43)
3. [x] Password file written in Mosquitto-compatible format - Delegates to `mosquitto_passwd` command
4. [x] User can be added and removed from password file - `add_user()` and `remove_user()` methods
5. [x] Integration with device registration - `devices.py` calls `mqtt_auth.add_user()` and `remove_user()`
6. [x] All tests pass - 15/15 tests passing (9 MQTT + 6 device)

### Quality: Minor observation, no blocking issues

**Security:**
- Password generation uses `secrets.token_urlsafe(32)` - cryptographically secure
- Password file created with mode 0o600 (owner read/write only)
- Mosquitto hashing uses PBKDF2-SHA512

**File locking:**
- The code imports `fcntl` but does not use it directly. The handoff correctly notes that file locking is delegated to the `mosquitto_passwd` command, which handles atomic writes. This is acceptable given the design choice to shell out to the tool.

**Error handling:**
- MQTT operations are wrapped in try/except in router (non-blocking)
- Appropriate error messages raised from service layer

**Minor observation (not blocking):**
- Line 2 of `mqtt_auth.py` imports `fcntl` but it is unused. This is dead code but does not affect functionality.

### Files Reviewed

| File | Lines | Status |
|------|-------|--------|
| backend/src/services/mqtt_auth.py | 177 | OK |
| backend/src/services/__init__.py | 5 | OK |
| backend/src/config.py | 19 | OK (mqtt_passwd_file setting added) |
| backend/src/routers/devices.py | 158 | OK (MQTT integration) |
| backend/tests/test_mqtt_auth.py | 188 | OK (meaningful tests) |
| backend/tests/test_devices.py | 256 | OK (MQTT mocks added) |

### Verification Commands Run

```bash
docker compose exec backend python -m pytest tests/test_mqtt_auth.py -v --tb=short
# Result: 9 passed in 0.01s

docker compose exec backend python -m pytest tests/test_devices.py -v --tb=short
# Result: 6 passed in 0.41s
```

---
Reviewer: lca-reviewer
Date: 2026-01-07
