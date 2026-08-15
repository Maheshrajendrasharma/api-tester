export function createWorkspace(name){

    return {

        id: crypto.randomUUID(),

        name,


        collections:[

        ],


        environment:{


            variables:[]


        },


        activeCollection:null

    }

}