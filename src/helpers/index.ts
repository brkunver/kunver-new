import approveBuilds from "./approve"
import { installDependencies } from "./install-deps"
import { copyTemplateFolder } from "./copy-template"
import { addManagerScript } from "./add-manager-script"
import { openInEditor } from "./open-in-editor"
import { createTemplateProject } from "./create-template"
import { changeProjectName } from "./postinstall"
import { configureCmakeProject, changeCmakeProjectName } from "./configure-cmake"

export {
  installDependencies,
  copyTemplateFolder,
  approveBuilds,
  addManagerScript,
  openInEditor,
  createTemplateProject,
  changeProjectName,
  configureCmakeProject,
  changeCmakeProjectName,
}
