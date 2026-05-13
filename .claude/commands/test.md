Run the tests for the **$ARGUMENTS** bounded context and analyze the results.
```bash
dotnet test --filter "FullyQualifiedName~Sambei.$ARGUMENTS" --configuration Release --logger "console;verbosity=detailed"
```

If tests fail:
1. Show me exactly which test failed and why
2. Identify if it's a domain logic bug, infrastructure issue, or test setup problem
3. Propose a fix — wait for my approval before changing production code