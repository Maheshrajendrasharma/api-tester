const STORAGE_KEY = "api_tester_workspaces"


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

        id:
            workspace.id ??
            crypto.randomUUID(),

        name:
            workspace.name ??
            "Unnamed Workspace",


        collections:
            Array.isArray(workspace.collections)
            ?
            workspace.collections
            :
            [],


        environments:
            Array.isArray(workspace.environments)
            ?
            workspace.environments
            :
            []

    }

}



export function loadWorkspaces(){

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


    return [
        migrated
    ]

}


    try{

        const parsed =
            JSON.parse(data)


        if(!Array.isArray(parsed)){

            return [
                createDefaultWorkspace()
            ]

        }


        return parsed.map(
            normalizeWorkspace
        )


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

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(workspaces)
    )

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