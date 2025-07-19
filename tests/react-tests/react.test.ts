// tests/react-tests/react.test.ts
import { runReactTests } from "./shared-tests"
import { packageManagers } from "../../src/project-starter"

packageManagers.forEach(pm => {
  runReactTests(pm)
})
