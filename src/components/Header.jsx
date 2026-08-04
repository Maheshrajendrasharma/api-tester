import { useState, useEffect, useRef } from "react";
import EnvironmentSelector from "./EnvironmentSelector";

function Header({
    environments,
    onEnvironmentChange,
    onImportEnvironment,
    onExportEnvironment,
    onDuplicateEnvironment,
    onDeleteEnvironment,
    onExportAllEnvironments,
}) {

    const [showEnvironmentMenu, setShowEnvironmentMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {

    function handleClickOutside(event) {

        if (
            menuRef.current &&
            !menuRef.current.contains(event.target)
        ) {
            setShowEnvironmentMenu(false);
        }

    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        document.removeEventListener(
            "mousedown",
            handleClickOutside
        );
    };

}, []);

    return (
        <header className="app-header">

            <div className="app-header-brand">
                <span className="app-header-mark">A</span>
                <span>API Tester</span>
            </div>

            <div
    className="header-environment-group"
    ref={menuRef}
>

                <EnvironmentSelector
                    environments={environments}
                    onChange={onEnvironmentChange}
                />

                <button
                    className="header-environment-menu"
                    onClick={() =>
                        setShowEnvironmentMenu(!showEnvironmentMenu)
                    }
                >
                    ⋮
                </button>

                {showEnvironmentMenu && (
                    <div className="environment-menu">

                        <button
    onClick={() => {

        setShowEnvironmentMenu(false);

        onImportEnvironment();

    }}
>
                            Import Environment
                        </button>

                        <button
    onClick={() => {

        setShowEnvironmentMenu(false);

        onExportEnvironment();

    }}
>
                            Export Environment
                        </button>

<button
    onClick={() => {
        setShowEnvironmentMenu(false)
        onRenameEnvironment()
    }}
>
    Rename Environment
</button>

                        <button
    onClick={() => {

        setShowEnvironmentMenu(false);

        onDuplicateEnvironment();

    }}
>
                            Duplicate Environment
                        </button>

                        <button
    onClick={() => {

        setShowEnvironmentMenu(false);

        onExportAllEnvironments();

    }}
>
                            Export All Environments
                        </button>

                        <hr />

                        <button
    className="danger"
    onClick={() => {

        setShowEnvironmentMenu(false);

        onDeleteEnvironment();

    }}
>
                            Delete Environment
                        </button>

                    </div>
                )}

            </div>

        </header>
    );
}

export default Header;