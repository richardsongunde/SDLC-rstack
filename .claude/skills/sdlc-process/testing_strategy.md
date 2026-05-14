# Testing Strategy Skill

## Test Types
- Unit Testing: 80%+ code coverage target
- Integration Testing: API endpoints, DB interactions
- E2E Testing: Critical user journeys
- Security Testing: OWASP Top 10
- Performance Testing: Load and stress scenarios

## Test Case Format
```
TC-NNN: [Title]
User Story: US-NNN
Type: Functional | Security | Performance | Integration
Precondition: [setup]
Steps: [1, 2, 3]
Expected Result: [outcome]
Priority: Critical | High | Medium | Low
```

## Mandatory Security Checks
1. SQL injection on all input fields
2. XSS on all user-visible outputs
3. JWT manipulation (expired, tampered, missing)
4. Rate limiting on auth endpoints
5. CORS configuration verification
6. Sensitive data not in URL parameters
7. Error messages don't leak system details
8. Password hashing verification
9. HTTPS enforcement

## API Test Scenarios (per endpoint)
- Valid request + correct auth → 200
- Valid request + no auth → 401
- Valid request + wrong role → 403
- Invalid request body → 400
- Non-existent resource → 404
