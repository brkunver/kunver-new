import approveBuilds from "./approve"
import { installDependencies } from "./install-deps"
import { copyTemplateFolder } from "./copy-template"
import { addManagerScript, configurePackageManager } from "./add-manager-script"
import { openInEditor } from "./open-in-editor"
import { createTemplateProject } from "./create-template"
import { changeProjectName } from "./postinstall"
import { configureCmakeProject, changeCmakeProjectName } from "./configure-cmake"
import { checkForUpdates, runBackgroundCheck } from "./update-checker"
import { commandExists } from "./utils"

export {
  installDependencies,
  copyTemplateFolder,
  approveBuilds,
  addManagerScript,
  configurePackageManager,
  openInEditor,
  createTemplateProject,
  changeProjectName,
  configureCmakeProject,
  changeCmakeProjectName,
  checkForUpdates,
  runBackgroundCheck,
  commandExists,
}
