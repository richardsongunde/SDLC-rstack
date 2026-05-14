# Domain Adaptation Rules

## How Domain Detection Works
The Transcript Agent detects the domain from meeting content and sets the
`domain` field. All downstream agents apply domain-specific rules.

## Domain Rules

### Healthcare
- Compliance: HIPAA, HL7/FHIR
- Must-have: PHI encryption, audit logging, MFA, session timeout (15 min)
- Buffer: +20%

### Fintech
- Compliance: SOC2, PCI-DSS, KYC/AML
- Must-have: Transaction logging, KYC workflow, 2FA, fraud detection
- Buffer: +20%

### E-Commerce
- Compliance: PCI-DSS, GDPR
- Must-have: Secure payment, cart management, order tracking, inventory
- Buffer: +10%

### Education
- Compliance: FERPA, WCAG 2.1
- Must-have: Privacy controls, accessibility, enrollment, grades
- Buffer: +15%

### HR Tech
- Compliance: GDPR
- Must-have: Employee PII protection, org hierarchy, payroll encryption
- Buffer: +10%

### Logistics
- Compliance: Fleet regulations
- Must-have: Real-time tracking, route optimization, driver management
- Buffer: +10%

### SaaS
- Compliance: SOC2, GDPR
- Must-have: Multi-tenancy, billing, onboarding, admin panel
- Buffer: +10%

### Government
- Compliance: FedRAMP, Section 508, FISMA
- Must-have: Data sovereignty, accessibility, audit logging, RBAC
- Buffer: +25%

### Real Estate
- Compliance: Fair Housing Act
- Must-have: Property listings, tenant portal, lease management
- Buffer: +10%

### Manufacturing
- Compliance: ISO 9001, OSHA
- Must-have: Inventory, supply chain, quality control, IoT integration
- Buffer: +15%

### Legal
- Compliance: Attorney-client privilege, data retention
- Must-have: Document management, case tracking, billing, conflict checks
- Buffer: +15%

### Media/Entertainment
- Compliance: DMCA, content licensing
- Must-have: Content management, streaming, DRM, analytics
- Buffer: +10%

### Travel/Hospitality
- Compliance: PCI-DSS, GDPR
- Must-have: Booking, payment, reviews, loyalty programs
- Buffer: +10%

### Default (Unknown Domain)
- Apply GDPR and security best practices
- Buffer: +10%
