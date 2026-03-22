import test from "node:test"
import assert from "node:assert/strict"

import {
  resolveCurrentUserIdentity,
  shouldAllowAnonymousFallback,
} from "./identity"

test("resolveCurrentUserIdentity prefers authenticated users over fallback", () => {
  const identity = resolveCurrentUserIdentity({
    authUserId: "real-user",
    allowAnonymousFallback: true,
    fallbackUserId: "anon-user",
  })

  assert.deepEqual(identity, {
    userId: "real-user",
    isAuthenticated: true,
    isAnonymous: false,
  })
})

test("resolveCurrentUserIdentity returns anonymous fallback in allowed dev mode", () => {
  const identity = resolveCurrentUserIdentity({
    authUserId: null,
    allowAnonymousFallback: true,
    fallbackUserId: "anon-user",
  })

  assert.deepEqual(identity, {
    userId: "anon-user",
    isAuthenticated: false,
    isAnonymous: true,
  })
})

test("resolveCurrentUserIdentity returns null identity when fallback is disabled", () => {
  const identity = resolveCurrentUserIdentity({
    authUserId: null,
    allowAnonymousFallback: false,
    fallbackUserId: "anon-user",
  })

  assert.deepEqual(identity, {
    userId: null,
    isAuthenticated: false,
    isAnonymous: false,
  })
})

test("shouldAllowAnonymousFallback only allows production fallback behind explicit flag", () => {
  assert.equal(shouldAllowAnonymousFallback({ nodeEnv: "development" }), true)
  assert.equal(shouldAllowAnonymousFallback({ nodeEnv: "test" }), true)
  assert.equal(shouldAllowAnonymousFallback({ nodeEnv: "production" }), false)
  assert.equal(
    shouldAllowAnonymousFallback({ nodeEnv: "production", explicitFlag: "true" }),
    true
  )
})
