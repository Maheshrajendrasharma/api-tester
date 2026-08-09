import EnvironmentSelector from "./EnvironmentSelector";

import { useState } from "react";

import {
    createVariableDraft,
    duplicateEnvironment,
    deleteEnvironment,
    loadEnvironments,
} from "../services/environmentService";

function EnvironmentPanel({
    environments,
    onEnvironmentChange,
    onEnvironmentsChange,

    onImportEnvironment,
    onExportEnvironment,
    onRenameEnvironment,
    onDuplicateEnvironment,
    onDeleteEnvironment,
    onExportAllEnvironments,
}) {

    const activeEnvironment =
        environments.find((environment) => environment.active)
        ?? environments[0];

    const variables = activeEnvironment?.variables ?? []

    const [showMenu, setShowMenu] = useState(false);

    function updateVariable(variableId, field, value) {

        const updated = environments.map(environment => {

            if (environment.id !== activeEnvironment.id) {
                return environment;
            }

            let variables = environment.variables.map(variable =>
                variable.id === variableId
                    ? { ...variable, [field]: value }
                    : variable
            );

            const last = variables[variables.length - 1];

            const lastIsBlank =
                last &&
                last.key.trim() === "" &&
                last.value.trim() === "";

            if (!lastIsBlank) {
                variables.push(createVariableDraft());
            }

            return {
                ...environment,
                variables
            };
        });

        onEnvironmentsChange(updated);
    }

    return (
        <aside
            className="environment-panel"
            aria-label="Environment variables"
        >

            {/* ENVIRONMENT HEADER */}
            <div
    className="environment-panel-header"
    onMouseLeave={() => setShowMenu(false)}
>

    <EnvironmentSelector
        environments={environments}
        onChange={onEnvironmentChange}
    />

    <button
        className="environment-panel-menu"
        onClick={() => setShowMenu(prev => !prev)}
    >
        ⋮
    </button>

    {showMenu && (
        <div className="environment-menu">

            <button
                onClick={() => {
                    setShowMenu(false);
                    onImportEnvironment();
                }}
            >
                Import Environment
            </button>

            <button
                onClick={() => {
                    setShowMenu(false);
                    onExportEnvironment();
                }}
            >
                Export Environment
            </button>

            <button
                onClick={() => {
                    setShowMenu(false);
                    onRenameEnvironment();
                }}
            >
                Rename Environment
            </button>

            <button
                onClick={() => {
                    setShowMenu(false);
                    onDuplicateEnvironment();
                }}
            >
                Duplicate Environment
            </button>

            <button
                onClick={() => {
                    setShowMenu(false);
                    onExportAllEnvironments();
                }}
            >
                Export All Environments
            </button>

            

            <button
                className="danger"
                onClick={() => {
                    setShowMenu(false);
                    onDeleteEnvironment();
                }}
            >
                Delete Environment
            </button>
           

        </div>
    )}

</div>



            {/* ENVIRONMENT VARIABLES TITLE */}
            <div className="sidebar-section-header">
                <span>ENVIRONMENT VARIABLES</span>
            </div>


            {/* VARIABLES */}
            <div className="environment-table-wrapper">

                <table className="environment-variables-table">

                    <thead>
                        <tr>
                            <th>Key</th>
                            <th>Value</th>
                        </tr>
                    </thead>

                    <tbody>

                        {activeEnvironment?.variables.map((variable) => (

                            <tr key={variable.id}>

                                <td>
                                    <input
                                        value={variable.key}
                                        onChange={(e) =>
                                            updateVariable(
                                                variable.id,
                                                "key",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Key"
                                    />
                                </td>

                                <td>
                                    <input
                                        value={variable.value}
                                        onChange={(e) =>
                                            updateVariable(
                                                variable.id,
                                                "value",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Value"
                                    />
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </aside>
    );
}

export default EnvironmentPanel;