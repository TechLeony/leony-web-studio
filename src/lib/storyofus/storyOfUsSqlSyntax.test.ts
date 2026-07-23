import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const workspaceRoot = process.cwd();
const storyOfUsSqlDirectory = join(workspaceRoot, "supabase", "storyofus");
const schemaQualifiedConditionalExpressionPattern = /pg_catalog\.(coalesce|greatest|least)\s*\(/i;

test("StoryOfUs SQL files do not schema-qualify PostgreSQL conditional expressions", () => {
  const sqlFilenames = readdirSync(storyOfUsSqlDirectory)
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  assert.ok(sqlFilenames.length > 0, "Expected StoryOfUs SQL files to be present.");

  for (const filename of sqlFilenames) {
    const sql = readFileSync(join(storyOfUsSqlDirectory, filename), "utf8");

    assert.doesNotMatch(
      sql,
      schemaQualifiedConditionalExpressionPattern,
      `${filename} must not use pg_catalog.coalesce/greatest/least; PostgreSQL conditional expressions cannot be schema-qualified.`,
    );
  }
});
