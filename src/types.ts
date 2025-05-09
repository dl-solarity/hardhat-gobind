export interface DlGoBindConfig {
  outdir: string;
  deployable: boolean;
  runOnCompile: boolean;
  abigenVersion: abigenVersionType;
  verbose: boolean;
  onlyFiles: string[];
  skipFiles: string[];
}

export interface DlGoBindUserConfig extends Partial<DlGoBindConfig> {}

type abigenVersionType = "v1" | "v2";
