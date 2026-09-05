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

    onConnectGoogleDrive,
    googleDriveStatus,

    saveStatus,
    googleDriveSyncing,
    onSyncGoogleDrive,
    onDisconnectGoogleDrive,

    authenticatedUser,
    onLogout,

    sidebarOpen,
    setSidebarOpen,

}) {

    const [showWorkspaceActions, setShowWorkspaceActions] =
        useState(false);

    const [showWorkspaceMenu, setShowWorkspaceMenu] =
        useState(false);

    const [showProfileMenu, setShowProfileMenu] =
        useState(false);

    const menuRef = useRef(null);
    const profileMenuRef = useRef(null);


    useEffect(() => {

        function handleClickOutside(event) {

            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setShowWorkspaceMenu(false);
                setShowWorkspaceActions(false);
            }

            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target)
            ) {
                setShowProfileMenu(false);
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

                        setSidebarOpen?.(
                            !sidebarOpen
                        );

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
                                previous =>
                                    !previous
                            );

                        }}
                        title="Select workspace"
                    >

                        <span className="workspace-selector-name">
                            {
                                selectedWorkspace ||
                                workspaceName
                            }
                        </span>

                        <span className="workspace-selector-arrow">
                            ▼
                        </span>

                    </button>


                    {/* WORKSPACE DROPDOWN */}

                    {showWorkspaceMenu && (

                        <div className="workspace-dropdown">

                            {workspaces.length > 0 ? (

                                workspaces.map(
                                    (workspace) => {

                                        const workspaceValue =
                                            workspace.name ||
                                            workspace;


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

                                    }
                                )

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
                                previous =>
                                    !previous
                            );

                        }}
                    >

                        ⋮

                    </button>


                    {showWorkspaceActions && (

                        <div
                            className="workspace-actions-menu"
                            onMouseDown={(e) => {

                                e.stopPropagation();

                            }}
                        >

                            <button
                                type="button"
                                onMouseDown={(e) => {

                                    e.stopPropagation();

                                }}
                                onClick={(e) => {

                                    e.stopPropagation();


                                    if (
                                        onCreateWorkspace
                                    ) {

                                        onCreateWorkspace();

                                    }


                                    setShowWorkspaceActions(
                                        false
                                    );

                                }}
                            >

                                New Workspace

                            </button>


                            <button
                                type="button"
                                onMouseDown={(e) => {

                                    e.stopPropagation();

                                }}
                                onClick={(e) => {

                                    e.stopPropagation();


                                    onRenameWorkspace?.();


                                    setShowWorkspaceActions(
                                        false
                                    );

                                }}
                            >

                                Rename Workspace

                            </button>


                            <button
                                type="button"
                                onMouseDown={(e) => {

                                    e.stopPropagation();

                                }}
                                onClick={(e) => {

                                    e.stopPropagation();


                                    onDeleteWorkspace?.();


                                    setShowWorkspaceActions(
                                        false
                                    );

                                }}
                            >

                                Delete Workspace

                            </button>


                            <hr />


                            <button
                                type="button"
                                onClick={(e) => {

                                    e.stopPropagation();


                                    onImportWorkspace?.();


                                    setShowWorkspaceActions(
                                        false
                                    );

                                }}
                            >

                                Import Workspace

                            </button>


                            <button
                                type="button"
                                onClick={(e) => {

                                    e.stopPropagation();


                                    onExportWorkspace?.();


                                    setShowWorkspaceActions(
                                        false
                                    );

                                }}
                            >

                                Export Workspace

                            </button>

                            <hr />

<div
    className="google-drive-menu-section"
    onMouseDown={(e) => {
        e.stopPropagation()
    }}
>

    <div className="google-drive-menu-status">

        <span
            className={
                googleDriveStatus?.authenticated
                    ? "google-drive-status-dot connected"
                    : "google-drive-status-dot"
            }
        >
            ●
        </span>

        <span>
            Google Drive
        </span>

    </div>


    {googleDriveStatus?.authenticated ? (

        <>

            <div className="google-drive-account">

                {googleDriveStatus?.user?.emailAddress ||
                 "Connected"}

            </div>


            <button
                type="button"
                disabled={
                    googleDriveSyncing
                }
                onMouseDown={(e) => {
                    e.stopPropagation()
                }}
                onClick={async (e) => {

                    e.stopPropagation()

                    await onSyncGoogleDrive?.()

                }}
            >
                {googleDriveSyncing
                    ? "Syncing..."
                    : "Sync from Google Drive"}
            </button>


            <button
                type="button"
                onMouseDown={(e) => {
                    e.stopPropagation()
                }}
                onClick={async (e) => {

                    e.stopPropagation()

                    await onDisconnectGoogleDrive?.()

                    setShowWorkspaceActions(
                        false
                    )

                }}
            >
                Disconnect Google Drive
            </button>

        </>

    ) : (

        <button
            type="button"
            onMouseDown={(e) => {
                e.stopPropagation()
            }}
            onClick={async (e) => {

                e.stopPropagation()

                await onConnectGoogleDrive?.()

                setShowWorkspaceActions(
                    false
                )

            }}
        >
            Connect Google Drive
        </button>

    )}

</div>


                

                        </div>

                    )}

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


    <div
        className={
            "workspace-save-status " +
            (
                saveStatus?.state === "error" ||
                saveStatus?.state === "cloud-error"
                    ? "error"
                    : saveStatus?.state === "saving"
                        ? "saving"
                        : saveStatus?.state === "saved-local"
                            ? "saved-local"
                            : "saved"
            )
        }
        title={
            saveStatus?.message ||
            "No changes to save"
        }
    >

        <span>
            {
                saveStatus?.state === "saving"
                    ? "⟳"
                    : saveStatus?.state === "error" ||
                      saveStatus?.state === "cloud-error"
                        ? "⚠"
                        : "✓"
            }
        </span>


        <span>
            {
                saveStatus?.message ||
                "Saved"
            }
        </span>

    </div>

</div>


{/* =================================================
    RIGHT SIDE
    USER PROFILE
   ================================================= */}

<div
    className="app-header-profile"
    ref={profileMenuRef}
    style={{
        WebkitAppRegion: "no-drag",
        position: "relative",
        display: "flex",
        alignItems: "center",
        marginLeft: "auto",
        marginRight: "145px",
    }}
>

    <button
        type="button"
        title={
            authenticatedUser?.name ||
            authenticatedUser?.email ||
            "Profile"
        }
        aria-label="Open profile menu"
        onClick={() => {
            setShowProfileMenu(
                previous => !previous
            );
        }}
        style={{
            WebkitAppRegion: "no-drag",
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.18)",
            background: "linear-gradient(135deg, #55e6c1, #20bf6b)",
            color: "#101010",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "15px",
            fontWeight: "700",
            cursor: "pointer",
            padding: 0,
        }}
    >
        {(
            authenticatedUser?.name ||
            authenticatedUser?.email ||
            "U"
        )
            .trim()
            .charAt(0)
            .toUpperCase()}
    </button>


    {showProfileMenu && (

        <div
            className="profile-dropdown"
            style={{
                position: "absolute",
                top: "48px",
                right: "12px",
                width: "300px",
                background: "#202020",
                border: "1px solid #383838",
                borderRadius: "8px",
                boxShadow: "0 12px 35px rgba(0,0,0,0.45)",
                padding: "14px",
                zIndex: 10000,
                color: "#f1f1f1",
            }}
            onMouseDown={(event) => {
                event.stopPropagation();
            }}
        >

            {/* USER INFORMATION */}

            <div
                style={{
                    textAlign: "center",
                    padding: "8px 4px 14px",
                }}
            >

                <div
                    style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        margin: "0 auto 10px",
                        background:
                            "linear-gradient(135deg, #55e6c1, #20bf6b)",
                        color: "#101010",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "25px",
                        fontWeight: "700",
                    }}
                >
                    {(
                        authenticatedUser?.name ||
                        authenticatedUser?.email ||
                        "U"
                    )
                        .trim()
                        .charAt(0)
                        .toUpperCase()}
                </div>


                <div
                    style={{
                        fontSize: "17px",
                        fontWeight: "600",
                        marginBottom: "5px",
                    }}
                >
                    {authenticatedUser?.name || "User"}
                </div>


                <div
                    style={{
                        fontSize: "13px",
                        color: "#999",
                        wordBreak: "break-word",
                    }}
                >
                    {authenticatedUser?.email || ""}
                </div>

            </div>


            {/* VIEW PROFILE */}

            <button
                type="button"
                onClick={() => {
                    setShowProfileMenu(false);
                }}
                style={{
                    width: "100%",
                    height: "42px",
                    borderRadius: "6px",
                    border: "1px solid #555",
                    background: "transparent",
                    color: "#f1f1f1",
                    cursor: "pointer",
                    fontSize: "14px",
                    marginBottom: "10px",
                }}
            >
                View Profile
            </button>


            <div
                style={{
                    height: "1px",
                    background: "#333",
                    margin: "4px 0 8px",
                }}
            />


            {/* SETTINGS */}

            <button
                type="button"
                onClick={() => {
                    setShowProfileMenu(false);
                }}
                style={{
                    width: "100%",
                    border: "0",
                    background: "transparent",
                    color: "#f1f1f1",
                    textAlign: "left",
                    padding: "11px 8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    borderRadius: "5px",
                }}
            >
                Settings
            </button>


            {/* SIGN OUT */}

            <button
                type="button"
                onClick={async () => {

                    setShowProfileMenu(false);

                    try {
                        await onLogout?.();
                    }
                    catch (error) {
                        console.error(
                            "[AUTH] Sign out failed:",
                            error
                        );
                    }

                }}
                style={{
                    width: "100%",
                    border: "0",
                    background: "transparent",
                    color: "#ff6b6b",
                    textAlign: "left",
                    padding: "11px 8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    borderRadius: "5px",
                }}
            >
                Sign Out
            </button>

        </div>

    )}

</div>


        </header>

    );

}

export default Header;