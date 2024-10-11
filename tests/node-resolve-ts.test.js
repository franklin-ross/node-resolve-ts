import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execCb);

describe("node-resolve-ts", () => {
  test("Node raises ERR_MODULE_NOT_FOUND without this resolver", async () => {
    await assert.rejects(
      () =>
        exec("node --experimental-strip-types main.ts", {
          encoding: "utf8",
        }),
      /ERR_MODULE_NOT_FOUND/
    );
  });

  describe("allows Typescript code to run with .js imports", () => {
    const commands = [
      {
        command:
          "node --experimental-strip-types --import node-resolve-ts/register main.ts",
        stdout: /^main\.ts: 3$/,
      },
      {
        command:
          "node --experimental-strip-types --import node-resolve-ts/register mts/main.mts",
        stdout: /^main\.mts: 3$/,
      },
      {
        command: "node --experimental-strip-types entry.ts",
        stdout: /^main\.ts: 3$/,
      },
    ];

    for (const { command, stdout: expectedStdout } of commands) {
      test(command, async () => {
        const { stdout: actualStdout } = await exec(command, {
          encoding: "utf8",
          timeout: 1000,
          env: { ...process.env, NODE_NO_WARNINGS: "1" },
        });
        assert.match(actualStdout, expectedStdout);
      });
    }
  });

  describe("can prefer JS over TS or visa-versa", () => {
    const commands = [
      {
        command:
          "node --experimental-strip-types --import node-resolve-ts/register-prefer-ts js-preference/main.ts",
        stdout: /^from TS$/,
      },
      {
        command:
          "node --experimental-strip-types --import node-resolve-ts/register-prefer-js js-preference/main.ts",
        stdout: /^from JS$/,
      },
    ];

    for (const { command, stdout: expectedStdout } of commands) {
      test(command, async () => {
        const { stdout: actualStdout } = await exec(command, {
          encoding: "utf8",
          timeout: 1000,
          env: { ...process.env, NODE_NO_WARNINGS: "1" },
        });
        assert.match(actualStdout, expectedStdout);
      });
    }
  });
});
