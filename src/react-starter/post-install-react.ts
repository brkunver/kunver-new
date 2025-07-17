import { deleteAppCss, deleteAssets, deleteEslintFile, clearAppTsx, editReadme, removePackages } from "./post-install-tools"

export async function postInstallReact(projectName: string, packageManager: string) {
  await Promise.all([
    deleteAppCss(projectName),
    deleteAssets(projectName),
    deleteEslintFile(projectName),
    clearAppTsx(projectName),
    editReadme(projectName),
    removePackages(projectName, packageManager)])
}