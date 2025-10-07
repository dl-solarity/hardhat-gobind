export interface DlGoBindConfig {
  outdir: string;
  deployable: boolean;
  runOnCompile: boolean;
  abigenVersion: abigenVersionType;
  verbose: boolean;
  onlyFiles: string[];
  skipFiles: string[];
  abigenPath: string;
}

export type DlGoBindUserConfig = Partial<DlGoBindConfig>;

type abigenVersionType = "v1" | "v2";
