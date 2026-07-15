import { createHash } from "node:crypto";

type RateLimitResult = {
  limited: boolean;
  retryAfterSeconds: number;
};

type Bucket = {
  windowStartedAt: number;
  count: number;
};

const WINDOW_MS = 60_000;
const MAX_SOURCE_BUCKETS = 256;
const UNAUTHORIZED_SOURCE_LIMIT = 10;
const UNAUTHORIZED_GLOBAL_LIMIT = 50;
const AUTHORIZED_GLOBAL_LIMIT = 2;

const unauthorizedSourceBuckets = new Map<string, Bucket>();
const unauthorizedGlobalBucket: Bucket = {
  windowStartedAt: 0,
  count: 0,
};
const authorizedGlobalBucket: Bucket = {
  windowStartedAt: 0,
  count: 0,
};

export function checkStoryOfUsEmailWorkerUnauthorizedRateLimit(request: Request): RateLimitResult {
  const now = Date.now();
  cleanupExpiredSourceBuckets(now);

  const globalResult = consumeBucket(unauthorizedGlobalBucket, UNAUTHORIZED_GLOBAL_LIMIT, now);

  if (globalResult.limited) {
    return globalResult;
  }

  const sourceKey = getSourceBucketKey(request);
  const sourceBucket = getSourceBucket(sourceKey, now);

  return consumeBucket(sourceBucket, UNAUTHORIZED_SOURCE_LIMIT, now);
}

export function checkStoryOfUsEmailWorkerExecutionRateLimit(): RateLimitResult {
  return consumeBucket(authorizedGlobalBucket, AUTHORIZED_GLOBAL_LIMIT, Date.now());
}

function consumeBucket(bucket: Bucket, limit: number, now: number): RateLimitResult {
  if (now - bucket.windowStartedAt >= WINDOW_MS) {
    bucket.windowStartedAt = now;
    bucket.count = 0;
  }

  if (bucket.count >= limit) {
    return {
      limited: true,
      retryAfterSeconds: getRetryAfterSeconds(bucket, now),
    };
  }

  bucket.count += 1;

  return {
    limited: false,
    retryAfterSeconds: 0,
  };
}

function getSourceBucket(sourceKey: string, now: number) {
  const existingBucket = unauthorizedSourceBuckets.get(sourceKey);

  if (existingBucket) {
    return existingBucket;
  }

  if (unauthorizedSourceBuckets.size >= MAX_SOURCE_BUCKETS) {
    deleteOldestSourceBucket();
  }

  const bucket: Bucket = {
    windowStartedAt: now,
    count: 0,
  };
  unauthorizedSourceBuckets.set(sourceKey, bucket);

  return bucket;
}

function cleanupExpiredSourceBuckets(now: number) {
  for (const [key, bucket] of unauthorizedSourceBuckets.entries()) {
    if (now - bucket.windowStartedAt >= WINDOW_MS) {
      unauthorizedSourceBuckets.delete(key);
    }
  }
}

function deleteOldestSourceBucket() {
  let oldestKey: string | null = null;
  let oldestStartedAt = Number.POSITIVE_INFINITY;

  for (const [key, bucket] of unauthorizedSourceBuckets.entries()) {
    if (bucket.windowStartedAt < oldestStartedAt) {
      oldestKey = key;
      oldestStartedAt = bucket.windowStartedAt;
    }
  }

  if (oldestKey) {
    unauthorizedSourceBuckets.delete(oldestKey);
  }
}

function getRetryAfterSeconds(bucket: Bucket, now: number) {
  return Math.max(1, Math.ceil((bucket.windowStartedAt + WINDOW_MS - now) / 1000));
}

function getSourceBucketKey(request: Request) {
  const headers = request.headers;
  const source =
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";

  return createHash("sha256")
    .update(source.trim().toLowerCase() || "unknown")
    .digest("hex");
}
