export interface DlGoBindConfig {
  outdir: string;
  deployable: boolean;
  runOnCompile: boolean;
  verbose: boolean;
  onlyFiles: string[];
  skipFiles: string[];
}

export interface DlGoBindUserConfig extends Partial<DlGoBindConfig> {}
