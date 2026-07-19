import assert from "node:assert/strict";
import { test } from "node:test";

import {
  StoryOfUsFinalSitePasscodeRateLimitError,
  parseFinalSitePasscodeRateLimitRpcRow,
} from "./finalSitePasscodeRateLimitUtils.ts";

test("accepts an allowed final-site passcode rate-limit response", () => {
  assert.deepEqual(
    parseFinalSitePasscodeRateLimitRpcRow({ limited: false, retry_after_seconds: 0 }),
    {
      limited: false,
      retryAfterSeconds: 0,
    },
  );
});

test("accepts a limited final-site passcode rate-limit response", () => {
  assert.deepEqual(
    parseFinalSitePasscodeRateLimitRpcRow({ limited: true, retry_after_seconds: 900 }),
    {
      limited: true,
      retryAfterSeconds: 900,
    },
  );
});

test("rejects malformed final-site passcode rate-limit responses", () => {
  assert.throws(
    () => parseFinalSitePasscodeRateLimitRpcRow({ limited: true, retry_after_seconds: 0 }),
    StoryOfUsFinalSitePasscodeRateLimitError,
  );
  assert.throws(
    () => parseFinalSitePasscodeRateLimitRpcRow({ limited: false, retry_after_seconds: 12 }),
    StoryOfUsFinalSitePasscodeRateLimitError,
  );
  assert.throws(
    () => parseFinalSitePasscodeRateLimitRpcRow({ limited: true }),
    StoryOfUsFinalSitePasscodeRateLimitError,
  );
});
