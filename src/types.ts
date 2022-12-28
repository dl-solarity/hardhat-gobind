export interface DlGoBindConfig {
  outDir: string
  deployable: boolean
  runOnCompile: boolean
  language: string
  abigenPath: string
}

export interface DlGoBindUserConfig extends Partial<DlGoBindConfig> { }
