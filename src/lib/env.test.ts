import test from "node:test"
import assert from "node:assert/strict"

import {
  MissingEnvironmentVariableError,
  getEnv,
  hasEnv,
  readBooleanEnv,
  requireEnv,
} from "./env"

test("getEnv trims values and treats blank strings as missing", () => {
  process.env.TEST_ENV_VALUE = "  hello  "
  process.env.TEST_ENV_BLANK = "   "

  assert.equal(getEnv("TEST_ENV_VALUE"), "hello")
  assert.equal(getEnv("TEST_ENV_BLANK"), undefined)
  assert.equal(hasEnv("TEST_ENV_VALUE"), true)
  assert.equal(hasEnv("TEST_ENV_BLANK"), false)

  delete process.env.TEST_ENV_VALUE
  delete process.env.TEST_ENV_BLANK
})

test("readBooleanEnv accepts common truthy and falsy values", () => {
  process.env.TEST_ENV_BOOL = "YES"
  assert.equal(readBooleanEnv("TEST_ENV_BOOL", false), true)

  process.env.TEST_ENV_BOOL = "off"
  assert.equal(readBooleanEnv("TEST_ENV_BOOL", true), false)

  process.env.TEST_ENV_BOOL = "unexpected"
  assert.equal(readBooleanEnv("TEST_ENV_BOOL", true), true)

  delete process.env.TEST_ENV_BOOL
})

test("requireEnv throws a typed error with missing variable names", () => {
  delete process.env.TEST_ENV_REQUIRED

  assert.throws(
    () => requireEnv("TEST_ENV_REQUIRED", "Test context"),
    (error: unknown) => {
      assert.ok(error instanceof MissingEnvironmentVariableError)
      assert.deepEqual(error.missing, ["TEST_ENV_REQUIRED"])
      assert.equal(error.context, "Test context")
      return true
    }
  )
})

test("requireEnv returns all requested vars when configured", () => {
  process.env.TEST_ENV_ONE = "one"
  process.env.TEST_ENV_TWO = "two"

  assert.deepEqual(requireEnv(["TEST_ENV_ONE", "TEST_ENV_TWO"]), {
    TEST_ENV_ONE: "one",
    TEST_ENV_TWO: "two",
  })

  delete process.env.TEST_ENV_ONE
  delete process.env.TEST_ENV_TWO
})
