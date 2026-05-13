Implement **$ARGUMENTS** following Sambei's Clean Architecture conventions.

Before writing code:
1. Identify which bounded context this belongs to
2. Identify the layer: Domain / Application / Infrastructure / Api
3. Check if there's a related aggregate or existing pattern in the codebase
4. Verify the domain rules in CLAUDE.md apply

Then implement it with:
- The domain object (aggregate method, value object, or domain event) if needed
- The application layer (Command or Query + Handler)
- The infrastructure implementation if needed
- Unit tests for domain logic

Show me the plan first. Wait for my approval before writing files.