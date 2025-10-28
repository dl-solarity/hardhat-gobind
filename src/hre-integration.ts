import { existsSync } from "fs";

import { Artifact } from "abigenjs/generator";

import { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import path from "path";

import { GOBIND_NPM_PACKAGE } from "./constants.js";

export async function getArtifacts(
  hre: HardhatRuntimeEnvironment,
  onlyFiles: string[],
  skipFiles: string[],
): Promise<Artifact[]> {
  const artifacts = hre.artifacts;
  const names = Array.from(await artifacts.getAllFullyQualifiedNames());

  onlyFiles = onlyFiles.map((p) => toUnixPath(path.normalize(p)));
  skipFiles = skipFiles.map((p) => toUnixPath(path.normalize(p)));

  const namesWithSources = await Promise.all(
    names.map(async (n) => {
      const artifact = await artifacts.readArtifact(n);
      return {
        name: n,
        contractName: artifact.contractName,
        sourceName: artifact.sourceName,
        abi: artifact.abi,
        bytecode: artifact.bytecode,
      };
    }),
  );

  const filtered = namesWithSources.filter(({ sourceName }) => {
    return (onlyFiles.length === 0 || containsPath(onlyFiles, sourceName)) && !containsPath(skipFiles, sourceName);
  });

  _verboseLog(hre, `${names.length} compiled contracts found, skipping ${names.length - filtered.length} of them\n`);

  return filtered;
}

export function tryFindAbigenJS(currentPath: string): string {
  if (existsSync(currentPath)) {
    return currentPath;
  }

  // Here we expect that the currentPath to the AbigenJS is as follows:
  // ./node_modules/abigenjs/bin/abigen.wasm
  // if we did not find the AbigenJS there, let's try to find it in the node_modules of the plugin
  const candidates = [
    path.join("node_modules", GOBIND_NPM_PACKAGE, "node_modules", "abigenjs", "bin", "abigen.wasm"),
    path.join("node_modules", "abigenjs", "bin", "abigen.wasm"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("AbigenJS not found");
}

function toUnixPath(userPath: string) {
  return userPath.split(path.sep).join(path.posix.sep);
}

function _verboseLog(hre: HardhatRuntimeEnvironment, msg: string) {
  if (hre && hre.config && hre.config.gobind && hre.config.gobind.verbose) {
    console.log(msg);
  }
}

export function containsPath(pathList: string[], source: string): boolean {
  const isSubPath = (parent: string, child: string) => {
    const parentTokens = parent.split(path.posix.sep).filter((i) => i.length);
    const childTokens = child.split(path.posix.sep).filter((i) => i.length);
    return parentTokens.every((t, i) => childTokens[i] === t);
  };

  return pathList === undefined ? false : pathList.some((p) => isSubPath(p, source));
}
