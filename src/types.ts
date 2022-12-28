export interface DlGoBindConfig {
  outDir: string;
  deployable: boolean;
  runOnCompile: boolean;
  useJava: boolean;
}

export interface DlGoBindUserConfig extends Partial<DlGoBindConfig> {
  outDir?: string;
  deployable?: boolean;
  runOnCompile?: boolean;
  useJava?: boolean;
}
