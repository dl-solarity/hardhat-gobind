export interface DlGoBindConfig {
  outdir: string;
  deployable: boolean;
  runOnCompile: boolean;
  abigenVersion: number;
  verbose: boolean;
  onlyFiles: string[];
  skipFiles: string[];
}

export interface DlGoBindUserConfig extends Partial<DlGoBindConfig> {}
