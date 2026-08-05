---
schema: duckbill/spec@1
feature-id: password-authentication
status: ready
plan-file: .duckbill/specs/password-authentication/plan.md
---

# Password Authentication

## Overview

Allow a registered person to authenticate with a password without revealing account existence.

## Actors

- Registered person.
- Authentication service operator.

## User Scenarios

### US-001: Sign in with a password

**Priority:** P1

**Value:** A registered person can access the protected product.

**Independent Test:** Submit valid and invalid credentials and observe the authentication result.

**Acceptance Scenarios:**

- Given valid credentials, when the person signs in, then access is granted.
- Given invalid credentials, when the person signs in, then access is denied without account disclosure.

## Goals

- Provide secure password authentication.

## Non-Goals

- Password recovery is not included.

## Requirements

### Functional Requirements

- **FR-001:** The product accepts valid credentials and rejects invalid credentials without disclosing account existence.

### Non-Functional Requirements

- **NFR-001:** Password verification completes within 500 milliseconds under the documented test load.

## External Contracts

- Authentication returns an allow or deny result with a generic denial reason.

## Data Behavior

- A failed attempt does not change the stored credential.

## Security and Privacy Requirements

- Denial behavior does not disclose whether an account exists.

## Acceptance Criteria

- **AC-001:** Automated tests demonstrate successful authentication and generic denial for invalid credentials.

## Product Outcomes

- **OUT-001:** Registered people can access the protected product using their password.

## Assumptions

- Registration has already stored a password verifier.

## References

- Project constitution.

