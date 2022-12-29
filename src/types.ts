export interface DlGoBindConfig {
  outdir: string;
  deployable: boolean;
  runOnCompile: boolean;
}

export interface DlGoBindUserConfig extends Partial<DlGoBindConfig> {}
