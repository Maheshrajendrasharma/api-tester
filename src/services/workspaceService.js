const STORAGE_KEY = "api_tester_workspaces"


const ACTIVE_WORKSPACE_KEY =
    "api_tester_active_workspace"

const OLD_COLLECTION_KEY =
    "apiTester.collections"


const OLD_ENVIRONMENT_KEY =
    "apiTester.environments"


function createDefaultWorkspace(){

    return {

        id: crypto.randomUUID(),

        name: "Default Workspace",

        collections: [],

        environments: []

    }

}


function migrateOldData(){

    const oldCollections =
        localStorage.getItem(
            OLD_COLLECTION_KEY
        )


    const oldEnvironments =
        localStorage.getItem(
            OLD_ENVIRONMENT_KEY
        )


    let collections = []

    let environments = []


    try{

        if(oldCollections){

            collections =
                JSON.parse(
                    oldCollections
                )

        }


    }
    catch{

        collections=[]

    }



    try{

        if(oldEnvironments){

            environments =
                JSON.parse(
                    oldEnvironments
                )

        }


    }
    catch{

        environments=[]

    }



    return {

        id:
            crypto.randomUUID(),

        name:
            "Default Workspace",

        collections,

        environments

    }

}




function normalizeWorkspace(workspace){

    return {
        id: workspace.id ?? crypto.randomUUID(),

        name: workspace.name ?? "Unnamed Workspace",

        collections:
            Array.isArray(workspace.collections)
                ? workspace.collections
                : [],

        environments:
            Array.isArray(workspace.environments)
                ? workspace.environments
                : [],
                        selectedRequestId:
            workspace.selectedRequestId ??
            null,




    }
}


export function loadWorkspaces(){

    performance.mark?.('api-tester:workspace-load-start')

    const data =
        localStorage.getItem(
            STORAGE_KEY
        )


    if(!data){

    const migrated =
        migrateOldData()


    saveWorkspaces(
        [migrated]
    )


    const workspaces = [
        migrated
    ]
    performance.mark?.('api-tester:workspace-load-finished')
    return workspaces

}


    try{

        const parsed =
            JSON.parse(data)


        if(!Array.isArray(parsed)){

            return [
                createDefaultWorkspace()
            ]

        }


        const workspaces = parsed.map(
            normalizeWorkspace
        )
        performance.mark?.('api-tester:workspace-load-finished')
        return workspaces


    }
    catch(error){


        console.error(
            "Failed loading workspaces",
            error
        )


        return [
            createDefaultWorkspace()
        ]

    }

}



export function saveWorkspaces(
    workspaces
){

    performance.mark?.('api-tester:workspace-save-start')
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(workspaces)
    )
    performance.mark?.('api-tester:workspace-save-finished')

}



export function createWorkspace(
    name
){

    return {

        id:
            crypto.randomUUID(),

        name:
            name.trim()
            ||
            "New Workspace",

        collections:[],

        environments:[]

    }

}



export function saveActiveWorkspaceId(
    workspaceId
){

    if(!workspaceId){
        localStorage.removeItem(
            ACTIVE_WORKSPACE_KEY
        )

        return
    }

    localStorage.setItem(
        ACTIVE_WORKSPACE_KEY,
        workspaceId
    )
}


export function loadActiveWorkspaceId(){

    return localStorage.getItem(
        ACTIVE_WORKSPACE_KEY
    )
}
