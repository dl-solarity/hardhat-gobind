import { ArgumentType } from "hardhat/types/arguments";
import type { NewTaskDefinition } from "hardhat/types/tasks";

import { task } from "hardhat/config";

const gobindTask: NewTaskDefinition = task(["gobind"], "Generate Go bindings for compiled contracts")
  .addOption({
    name: "outdir",
    type: ArgumentType.STRING,
    description: "Output directory for generated bindings (Go package name is derived from it as well)",
    defaultValue: "./generated-types/bindings",
  })
  .addFlag({
    name: "deployable",
    description: "Generate bindings with the bytecode in order to deploy the contracts within Go",
  })
  .addFlag({
    name: "noCompile",
    description: "Do not compile smart contracts before the generation",
  })
  .addFlag({
    name: "v2",
    description: "Use abigen version 2",
  })
  .addOption({
    name: "abigenPath",
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
    description: "Path to the abigen binary",
    defaultValue: "./node_modules/@solarity/hardhat-gobind/bin/abigen.wasm",
  })
  .setAction(() => import("./task-action.js"))
  .build();

export default gobindTask;
