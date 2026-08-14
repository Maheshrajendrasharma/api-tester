import VariableField from './VariableField'


function createBlankHeader(){

    return {

        id: crypto.randomUUID(),

        enabled:true,

        key:"",

        value:""

    }

}





function normalizeHeaders(headers = []) {


    const filledRows = headers.filter((header)=>{


        return (

            String(header?.key ?? '').trim() !== '' ||

            String(header?.value ?? '').trim() !== ''

        )


    })




    const emptyRows = headers.filter((header)=>{


        return (

            String(header?.key ?? '').trim() === '' &&

            String(header?.value ?? '').trim() === ''

        )


    })




    return [


        ...filledRows,


        emptyRows.length > 0

            ?

            emptyRows[0]

            :

            createBlankHeader()


    ]



}







function HeadersEditor({


  environment,


  headers = [],


  onChange



}) {



    const rows = normalizeHeaders(headers)






    function updateHeader(

        id,

        field,

        value

    ){



        const updated = headers.map((header)=>{


            if(header.id === id){


                return {


                    ...header,


                    [field]:value


                }


            }



            return header


        })





        onChange(

            normalizeHeaders(updated)

        )



    }







  return (


    <div className="headers-editor">



      <div className="headers-table">







        <div className="headers-table-header">



          <div className="headers-column-enabled">

            Enabled

          </div>




          <div className="headers-column-key">

            Key

          </div>




          <div className="headers-column-value">

            Value

          </div>




        </div>









        <div className="headers-table-body">





          {

            rows.map((header)=>(



              <div


                className="headers-data-row"


                key={header.id}



              >







                <div className="headers-cell-enabled">



                  <input


                    type="checkbox"


                    checked={header.enabled}



                    onChange={(event)=>


                      updateHeader(


                        header.id,


                        'enabled',


                        event.target.checked


                      )

                    }



                  />



                </div>









                <div className="headers-cell-key">





                  <VariableField



                    environment={environment}



                    value={header.key}



                    placeholder="Key"



                    className="headers-key-field"




                    onChange={(event)=>



                      updateHeader(


                        header.id,


                        'key',


                        event.target.value



                      )


                    }



                  />



                </div>









                <div className="headers-cell-value">





                  <VariableField



                    environment={environment}



                    value={header.value}



                    placeholder="Value"



                    className="headers-value-field"




                    onChange={(event)=>



                      updateHeader(


                        header.id,


                        'value',


                        event.target.value



                      )


                    }



                  />



                </div>









              </div>




            ))



          }





        </div>







      </div>





    </div>


  )

}




export default HeadersEditor