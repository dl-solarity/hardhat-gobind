import { Artifact } from "abigenjs/generator";

import { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import path from "path";

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
