import { useState, useEffect, useRef } from "react";

function Header({

    environments,

    onEnvironmentChange,

    onImportEnvironment,

    onExportEnvironment,

    onDuplicateEnvironment,

    onDeleteEnvironment,

    onExportAllEnvironments,


    workspaceName = "Workspace",

    workspaces = [],

    selectedWorkspace,

    onWorkspaceChange,


    onCreateWorkspace,

    onRenameWorkspace,

    onDeleteWorkspace,

    onImportWorkspace,

    onExportWorkspace,


    sidebarOpen,

    setSidebarOpen,

}) {

const [showWorkspaceActions, setShowWorkspaceActions] =
    useState(false);

    const [showWorkspaceMenu, setShowWorkspaceMenu] =
    useState(false);

    const menuRef = useRef(null);


    

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setShowWorkspaceMenu(false);
setShowWorkspaceActions(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    return (
        <header
    className="app-header"
    style={{
        WebkitAppRegion: "drag",
    }}
>

            {/* =================================================
                LEFT SIDE
                Sidebar + Workspace + Options
               ================================================= */}

            <div className="app-header-left">

                {/* SIDEBAR TOGGLE */}

                <button
                    type="button"
                    className="sidebar-toggle-button"
                    title={
                        sidebarOpen
                            ? "Hide sidebar"
                            : "Show sidebar"
                    }
                    aria-label={
                        sidebarOpen
                            ? "Hide sidebar"
                            : "Show sidebar"
                    }
                    onClick={() => {
                        setSidebarOpen?.(!sidebarOpen);
                    }}
                >
                    <span className="hamburger-icon">
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>


                {/* WORKSPACE SELECTOR */}

                <div
                    className="workspace-selector-wrapper"
                    ref={menuRef}
                >

                    <button
                        type="button"
                        className="workspace-selector-button"
onClick={() => {

    

    setShowWorkspaceMenu(
        previous => !previous
    )

}}
                        title="Select workspace"
                    >

                        <span className="workspace-selector-name">
                            {selectedWorkspace || workspaceName}
                        </span>

                        <span className="workspace-selector-arrow">
                            ▼
                        </span>

                    </button>


                    {/* WORKSPACE DROPDOWN */}

                    {showWorkspaceMenu && (
                        <div className="workspace-dropdown">

                            {workspaces.length > 0 ? (

                                workspaces.map((workspace) => {

                                    const workspaceValue =
                                        workspace.name || workspace;

                                    return (
                                        <button
                                            key={
                                                workspace.id ||
                                                workspaceValue
                                            }
                                            type="button"
                                            className={
                                                "workspace-dropdown-item" +
                                                (
                                                    selectedWorkspace ===
                                                    workspaceValue
                                                        ? " active"
                                                        : ""
                                                )
                                            }
                                            onClick={() => {

                                                onWorkspaceChange?.(
                                                    workspace
                                                );

                                                setShowWorkspaceMenu(
                                                    false
                                                );
                                            }}
                                        >
                                            {workspaceValue}
                                        </button>
                                    );
                                })

                            ) : (

                                <div className="workspace-dropdown-empty">
                                    No workspaces available
                                </div>

                            )}

                        </div>
                    )}

                </div>


                {/* WORKSPACE OPTIONS */}

<div className="workspace-actions-wrapper">

<button
    type="button"
    className="workspace-menu-button"
    title="Workspace options"
    aria-label="Workspace options"

onClick={() => {

    

    setShowWorkspaceActions(
        previous => !previous
    )

}}
>
    ⋮
</button>


{
showWorkspaceActions && (

<div
    className="workspace-actions-menu"
    onMouseDown={(e)=>{
        e.stopPropagation()
    }}
>


<button
    type="button"
    onMouseDown={(e)=>{
        e.stopPropagation()
    }}
    onClick={(e)=>{

        e.stopPropagation()

        

        if(onCreateWorkspace){
            onCreateWorkspace()
        }

        setShowWorkspaceActions(false)

    }}
>
    New Workspace
</button>



<button
    type="button"
    onMouseDown={(e)=>{
        e.stopPropagation()
    }}
    onClick={(e)=>{

        e.stopPropagation()

        

        onRenameWorkspace?.()

        setShowWorkspaceActions(false)

    }}
>
    Rename Workspace
</button>



<button
    type="button"
    onMouseDown={(e)=>{
        e.stopPropagation()
    }}
    onClick={(e)=>{

        e.stopPropagation()

        

        onDeleteWorkspace?.()

        setShowWorkspaceActions(false)

    }}
>
    Delete Workspace
</button>



<hr/>


<button
    type="button"
    onClick={(e)=>{

        e.stopPropagation()

        

        onImportWorkspace?.()

        setShowWorkspaceActions(false)

    }}
>
    Import Workspace
</button>



<button
    type="button"
    onClick={(e)=>{

        e.stopPropagation()

        

        onExportWorkspace?.()

        setShowWorkspaceActions(false)

    }}
>
    Export Workspace
</button>


</div>

)
}


</div>

            </div>


            {/* =================================================
                CENTER
                API TESTER BRAND
               ================================================= */}

            <div className="app-header-brand">

                <span className="app-header-mark">
                    A
                </span>

                <span className="app-header-title">
                    API Tester
                </span>

            </div>

        </header>
    );
}

export default Header;