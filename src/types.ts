export interface DlGoBindConfig {
  outDir: string
  runOnCompile: boolean
  abigenPath: string
}

export interface DlGoBindUserConfig extends Partial<DlGoBindConfig> { }
