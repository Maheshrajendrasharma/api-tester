
import { useState } from "react"
import {
    createVariableDraft,
    duplicateEnvironment,
    deleteEnvironment,
    loadEnvironments,
} from '../services/environmentService'

function EnvironmentPanel({ environments, onEnvironmentChange, onEnvironmentsChange, onImportEnvironment, onExportEnvironment }) {
  const activeEnvironment = environments.find((environment) => environment.active) ?? environments[0]
  const [showMenu, setShowMenu] = useState(false)



function updateVariable(variableId, field, value) {

    const updated = environments.map(environment => {

        if (environment.id !== activeEnvironment.id)
            return environment

        let variables = environment.variables.map(variable =>
            variable.id === variableId
                ? { ...variable, [field]: value }
                : variable
        )

        const last = variables[variables.length - 1]

        const lastIsBlank =
            last &&
            last.key.trim() === "" &&
            last.value.trim() === ""

        if (!lastIsBlank) {
            variables.push(createVariableDraft())
        }

        return {
            ...environment,
            variables
        }

    })

    onEnvironmentsChange(updated)

}
  

 



  return (
    <aside className="environment-panel" aria-label="Environment variables">

 <div className="sidebar-section-header">
    <span>VARIABLES</span>
</div>


 <div className="environment-table-wrapper">

<table className="environment-variables-table">
          <thead><tr><th>Key</th><th>Value</th></tr></thead>
          <tbody>
            {activeEnvironment?.variables.map((variable) => (
              <tr key={variable.id}>
    <td>
        <input
            value={variable.key}
            onChange={(e)=>updateVariable(variable.id,"key",e.target.value)}
            placeholder="Key"
        />
    </td>

    <td>
        <input
            value={variable.value}
            onChange={(e)=>updateVariable(variable.id,"value",e.target.value)}
            placeholder="Value"
        />
    </td>
</tr>
            ))}
          </tbody>
        </table>

</div>
        <div>
     
      </div>
    </aside>
  )
}

export default EnvironmentPanel
