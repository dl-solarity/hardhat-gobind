export interface DlGoBindConfig {
  outDir: string
  runOnCompile: boolean
}

export interface DlGoBindUserConfig extends Partial<DlGoBindConfig> { }
