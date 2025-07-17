import {
  deleteAppCss,
  deleteAssets,
  deleteEslintFile,
  clearAppTsx,
  editReadme,
  removePackages,
} from "./post-install-tools"

export async function postInstallReact(projectName: string, packageManager: string, cwd: string) {
  await Promise.all([
    deleteAppCss(projectName, cwd),
    deleteAssets(projectName, cwd),
    deleteEslintFile(projectName, cwd),
    clearAppTsx(projectName, cwd),
    editReadme(projectName, cwd),
    removePackages(projectName, packageManager, cwd),
  ])
}
