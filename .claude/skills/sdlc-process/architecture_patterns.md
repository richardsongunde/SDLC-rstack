# Architecture Patterns Skill

## Pattern Selection
- **Monolith**: < 10 FRs, small team, quick delivery
- **Modular Monolith**: 10-25 FRs, medium team, clear module boundaries
- **Microservices**: 25+ FRs, large team, independent scaling needs

## Tech Stack Decision Matrix

### Backend
- Node.js/Express: Real-time, API-heavy, rapid development
- Python/FastAPI: Data-heavy, ML-integrated, analytics
- Java/Spring Boot: Enterprise, high-compliance, large teams

### Frontend
- React.js: Most versatile, large ecosystem
- Next.js: SSR/SEO matters, marketing sites
- Vue.js: Rapid development, simpler learning curve

### Database
- PostgreSQL: Structured data, compliance, ACID
- MongoDB: Document-heavy, flexible schema
- Redis: Always include for caching and sessions

### Authentication
- JWT + refresh tokens: Standard API auth
- OAuth2: Third-party integrations
- MFA (TOTP): Compliance-heavy domains

## Mandatory Components
1. Authentication & Authorization
2. Audit Logging
3. Error Handling & Monitoring
4. Rate Limiting
5. Input Validation
6. Environment Configuration
