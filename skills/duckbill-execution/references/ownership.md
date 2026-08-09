# Execution Ownership

Classify the requested outcome before editing. Ownership follows semantic impact, not the size or location of the diff.

## Execution-owned

Apply work that realizes the selected task inside the current technical design and product behavior. A large
implementation MAY remain execution-owned when it does not alter upstream meaning.

## Planning-owned

Stop when work changes HOW: architecture, component responsibility, integration strategy, persistence strategy, internal
data design, dependency strategy, task decomposition, or another material technical decision.

Example: the plan stores sessions in the existing database and feedback asks to move them to Redis. If the specification
allows either, planning owns the change. Code MUST NOT change first with planning updated afterward.

## Specification-owned

Stop when work changes WHAT or WHY: observable behavior, product scope, acceptance, external product contracts,
mandatory product constraints, security or privacy behavior, or other product truth.

Example: the specification promises synchronous payment completion and feedback asks for completion later. Specification
owns the change even if the code diff is small. If the observable completion mechanism is unresolved, report that
decision without choosing polling, webhook, notification, or another mechanism.

Execution MUST NOT silently reinterpret upstream artifacts or perform an upstream change itself.
