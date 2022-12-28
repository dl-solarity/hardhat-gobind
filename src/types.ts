export interface DlGoBindConfig {
  outDir: string
  deployable: boolean
  runOnCompile: boolean
  abigenPath: string
}

export interface DlGoBindUserConfig extends Partial<DlGoBindConfig> { }
