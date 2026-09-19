# Security Documentation

## Authentication

- **Method**: JWT (JSON Web Tokens)
- **Library**: python-jose with cryptography backend
- **Token lifetime**: Configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 60 min)
- **Algorithm**: HS256 (configurable via `JWT_ALGORITHM`)
- **Secret**: Environment variable `JWT_SECRET` — must be changed in production

## Password Security

- **Hashing**: bcrypt via passlib
- **Storage**: Only password hashes stored, never plain text
- **Verification**: Constant-time comparison

## Authorization

- All document endpoints require valid JWT
- Users can only access their own documents
- Ownership checked at repository level via `user_id` filter
- Cross-user access attempts return 404 (no information leak)

## File Validation

### Multi-Layer Validation
1. **Extension check**: Only `.pdf`, `.jpg`, `.jpeg`, `.png` allowed
2. **MIME type check**: Validates Content-Type header
3. **Magic bytes check**: Verifies actual file content signature
4. **Size check**: Configurable max size (default 25MB)
5. **Empty file check**: Rejects zero-byte uploads

### File Storage Security
- **Safe filenames**: UUID-based names (no user-controlled paths)
- **Path traversal protection**: Resolved paths checked against base directory
- **Storage abstraction**: Files never served directly to users

## API Security

- **CORS**: Configurable allowed origins
- **Input validation**: Pydantic models on all endpoints
- **Error responses**: Structured errors without sensitive data
- **Rate limiting**: Can be added via middleware (not implemented by default)

## Secrets Management

### Never Committed
- Database passwords
- JWT secrets
- AI API keys
- Redis passwords

### Environment Variables
All secrets loaded from environment variables via `.env` file.
The `.env.example` template contains placeholder values only.

## External Service Security

### AI API Keys
- Stored in `AI_API_KEY` environment variable
- Never logged
- Never included in API responses
- Optional — system works without AI keys

### OCR
- Tesseract runs locally — no external API calls
- No data leaves the server for OCR processing
