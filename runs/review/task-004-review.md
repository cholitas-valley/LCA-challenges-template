## Review: task-004
Status: APPROVED

### Tests Validation (6 tests passing)
- **test_register_new_device**: Properly validates response structure, checks `device_id`, `mqtt_username`, `mqtt_password`, `mqtt_host`, `mqtt_port` are present. Verifies username starts with `device_` and password is not the placeholder string.
- **test_register_same_mac_returns_same_device**: Tests idempotency correctly - verifies same device_id and username returned, and that password becomes `<stored_securely>` on second registration.
- **test_list_devices_returns_list_with_total**: Validates response structure with `devices` list and `total` count. Checks device properties including status.
- **test_list_devices_pagination**: Tests pagination with limit/offset parameters, verifies total count preserved across pages.
- **test_delete_device_removes_it**: Confirms 200 response on successful delete, verifies mock called.
- **test_delete_nonexistent_device_returns_404**: Validates 404 response for missing device.

Tests are meaningful unit tests with mocked repositories. They validate actual endpoint behavior, not trivial assertions.

### Definition of Done Checklist
- [x] POST /api/devices/register creates device and returns MQTT credentials (verified in code and tests)
- [x] MAC address uniqueness enforced - get_device_by_mac check before creation, returns existing device on duplicate
- [x] GET /api/devices returns device list with pagination - limit/offset query parameters supported
- [x] DELETE /api/devices/{id} removes device - 404 on not found
- [x] Password stored as bcrypt hash - `bcrypt.hashpw()` with `bcrypt.gensalt()` before storage
- [x] All tests pass (6/6)

### Security Review
- bcrypt used correctly for password hashing at `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/routers/devices.py` lines 58-62
- Password only returned in plaintext on initial registration (line 79)
- Subsequent MAC registrations return `<stored_securely>` placeholder (line 43)
- Password hash stored in `mqtt_password_hash` column, never exposed in responses

### Async Patterns
- All repository functions use `async def` and `await`
- FastAPI endpoints use `async def`
- asyncpg `Connection` used correctly with parameterized queries

### Code Quality
- No TODO/FIXME in critical paths
- Error handling present (404 on device not found)
- UUID4 used for device IDs
- secrets.token_urlsafe(32) for password generation

### Files Reviewed
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/models/device.py` - Pydantic models correctly defined
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/repositories/device.py` - Repository with all required CRUD operations
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/routers/devices.py` - Endpoints implemented per spec
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/tests/test_devices.py` - 6 meaningful tests
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/tests/conftest.py` - Test setup with mocked DB
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/main.py` - Router included, lifespan handlers for pool

### Notes
- Test approach uses mocked repositories rather than integration tests - this is acceptable for unit testing endpoint logic
- Idempotency limitation documented: cannot return original password on repeat registration (security tradeoff is correct)
