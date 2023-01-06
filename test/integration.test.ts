import { assert } from "chai";
import { existsSync, rmSync } from "fs";
import { TASK_CLEAN, TASK_COMPILE } from "hardhat/builtin-tasks/task-names";

import { TASK_GOBIND } from "../src/constants";
import { useEnvironment } from "./helpers";

describe("GoBind x Hardhat integration", function () {
  const abigenPath = { _abigenPath: "../../../bin/abigen.wasm" };

  const assertExists = (path: string) => assert.isTrue(existsSync(path), `path ${path} should exist`);
  const assertNotExists = (path: string) => assert.isFalse(existsSync(path), `path ${path} should not exist`);
  const assertContractsGenerated = (outdir: string) => {
    assertExists(outdir);
    assertExists(`${outdir}/contracts`);
    assertExists(`${outdir}/contracts/Lock.go`);
  };

  describe("Main logic with default config", function () {
    useEnvironment("hardhat-project-undefined-config");

    it("does not generate bindings with --no-compile and no artifacts", async function () {
      await this.env.run(TASK_GOBIND, { noCompile: true, ...abigenPath });
      assertNotExists(this.outdir);
    });

    it("compiles and generates bindings", async function () {
      assertNotExists(this.outdir);

      await this.env.run(TASK_GOBIND, abigenPath);
      assertContractsGenerated(this.outdir);
    });

    it("cleans up generated bindings", async function () {
      assertExists(this.outdir);

      await this.env.run(TASK_CLEAN);
      assertNotExists(this.outdir);
    });

    it("generates bindings on compilation with --generate-bindings", async function () {
      assertNotExists(this.outdir);

      await this.env.run(TASK_COMPILE, { generateBindings: true, ...abigenPath });
      assertContractsGenerated(this.outdir);
    });
  });

  describe("onlyFiles, skipFiles parameters", function () {
    useEnvironment("hardhat-project-extended");

    this.beforeEach(function () {
      assertNotExists(this.outdir);
    });

    // Manual removing of generated files should be faster than full cleanup because of the frequent re-compilations
    // Another way is to use the different outdir for each case
    // Surprisingly, full cleanup after each case is faster than manual rm of outir
    this.afterEach(async function () {
      await this.env.run(TASK_CLEAN);
      // rmSync(this.outdir, { recursive: true, force: true });
    });

    // directories are absent in paths for a simple usage of assertNotGenerated
    const contractPaths = ["Mock1.go", "Mock2.go"].map((p) => "contracts/" + p);
    const interfacePaths = ["IMock1.go", "IMock2.go"].map((p) => "contracts/interfaces/" + p);
    const dependecyPaths = ["access/Ownable.go", "utils/Context.go"].map((p) => "@openzeppelin/contracts/" + p);
    const allPaths = [...contractPaths, ...interfacePaths, ...dependecyPaths];

    const testCases = [
      { only: ["@openzeppelin/contracts/access/Ownable.sol"], skip: [] },
      { only: ["contracts"], skip: [] },
      { only: [], skip: ["contracts/Mock.sol"] },
      { only: [], skip: ["@openzeppelin"] },
      { only: ["contracts"], skip: ["@openzeppelin", "contracts/interfaces"] },
      { only: ["any-folder/non-existent-file.txt"], skip: ["any-folder/another-bad-file.go"] },
    ];

    const caseToString = (index: number): string => {
      if (index >= testCases.length) {
        throw Error("getTestCase: index argument out of range");
      }
      const tc = testCases[index];
      return `onlyFiles=[${tc.only}] and skipFiles=[${tc.skip}]`;
    };

    const assertGenerated = (outdir: string, paths: string[]) => {
      assertExists(outdir);
      paths.forEach((p) => assertExists(`${outdir}/${p}`));
    };

    const assertNotGenerated = (outdir: string, paths: string[]) => {
      const wrongPaths = [
        "node_modules",
        "contracts/Mock.go",
        "contracts/interfaces/IMock.go",
        "any-folder/non-existent-file.txt",
        "any-folder/another-bad-file.go",
      ];
      paths.concat(wrongPaths).forEach((p) => assertNotExists(`${outdir}/${p}`));
    };

    it("correctly generates bindings for all contracts", async function () {
      await this.env.run(TASK_GOBIND, abigenPath);

      assertGenerated(this.outdir, allPaths);
      assertNotGenerated(this.outdir, []);
    });

    it(`for ${caseToString(0)} generates only Ownable.go`, async function () {
      const ownablePath = "@openzeppelin/contracts/access/Ownable.go";
      this.env.config.gobind.onlyFiles = testCases[0].only;
      await this.env.run(TASK_GOBIND, abigenPath);

      assertGenerated(this.outdir, [ownablePath]);
      assertNotGenerated(
        this.outdir,
        allPaths.filter((p) => p != ownablePath)
      );
    });

    it(`for ${caseToString(1)} generates only contracts and interfaces`, async function () {
      this.env.config.gobind.onlyFiles = testCases[1].only;
      await this.env.run(TASK_GOBIND, abigenPath);

      assertGenerated(this.outdir, [...contractPaths, ...interfacePaths]);
      assertNotGenerated(this.outdir, dependecyPaths);
    });

    it(`for ${caseToString(2)} generates for all except Mock1.go and Mock2.go`, async function () {
      this.env.config.gobind.skipFiles = testCases[2].skip;
      await this.env.run(TASK_GOBIND, abigenPath);

      assertGenerated(this.outdir, [...interfacePaths, ...dependecyPaths]);
      assertNotGenerated(this.outdir, contractPaths);
    });

    it(`for ${caseToString(3)} generates for all except dependencies`, async function () {
      this.env.config.gobind.skipFiles = testCases[3].skip;
      await this.env.run(TASK_GOBIND, abigenPath);

      assertGenerated(this.outdir, [...contractPaths, ...interfacePaths]);
      assertNotGenerated(this.outdir, dependecyPaths);
    });

    it(`for ${caseToString(4)} generates contracts, skips dependencies and interfaces`, async function () {
      this.env.config.gobind.onlyFiles = testCases[4].only;
      this.env.config.gobind.skipFiles = testCases[4].skip;
      await this.env.run(TASK_GOBIND, abigenPath);

      assertGenerated(this.outdir, [...contractPaths]);
      assertNotGenerated(this.outdir, [...interfacePaths, ...dependecyPaths]);
    });

    it(`for ${caseToString(5)} generates nothing`, async function () {
      this.env.config.gobind.onlyFiles = testCases[5].only;
      this.env.config.gobind.skipFiles = testCases[5].skip;
      await this.env.run(TASK_GOBIND, abigenPath);

      assertNotGenerated(this.outdir, allPaths);
    });
  });
});