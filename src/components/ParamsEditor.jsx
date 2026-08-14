import VariableField from './VariableField'



function normalizeParameters(parameters = []) {

    const filledRows = parameters.filter((row) => {

        return (
            String(row?.key ?? '').trim() !== '' ||
            String(row?.value ?? '').trim() !== '' ||
            String(row?.description ?? '').trim() !== ''
        )

    })


    const emptyRows = parameters.filter((row)=>{

        return (
            String(row?.key ?? '').trim() === '' &&
            String(row?.value ?? '').trim() === '' &&
            String(row?.description ?? '').trim() === ''
        )

    })


    return [

        ...filledRows,

        emptyRows.length > 0

            ? emptyRows[0]

            : {

                id: crypto.randomUUID(),

                enabled:true,

                key:'',

                value:'',

                description:''

            }

    ]

}


function ParamsEditor({
  environment,
  parameters = [],
  onChange
}) {


  function ensureBlankRow(rows) {

    if (rows.length === 0) {

      return [
        createEmptyParameter()
      ]

    }


    const last =
      rows[rows.length - 1]


const lastFilled =
    last &&
    (
        String(last.key ?? '').trim() !== '' ||
        String(last.value ?? '').trim() !== '' ||
        String(last.description ?? '').trim() !== ''
    )


    if (lastFilled) {

      return [
        ...rows,
        createEmptyParameter()
      ]

    }


    return rows

  }



 const rows = normalizeParameters(parameters);



function updateParameter(id, field, value){

    const updated = parameters.map((row)=>{

        if(row.id === id){

            return {
                ...row,
                [field]:value
            }

        }

        return row

    })


    onChange(
        normalizeParameters(updated)
    )

}





  return (

    <div className="params-editor">


      <div className="params-table">


        <div className="params-table-header">


          <div className="params-column-enabled">
            Enabled
          </div>


          <div className="params-column-key">
            Key
          </div>


          <div className="params-column-value">
            Value
          </div>


          <div className="params-column-description">
            Description
          </div>


        </div>





        <div className="params-table-body">


          {
            rows.map((parameter)=>(


              <div

                className="params-data-row"

                key={parameter.id}

              >



                <div className="params-cell-enabled">


                  <input

                    type="checkbox"

                    checked={
                      parameter.enabled
                    }


                    onChange={(event)=>

                      updateParameter(

                        parameter.id,

                        'enabled',

                        event.target.checked

                      )

                    }

                  />


                </div>





                <div className="params-cell-key">


                  <VariableField


                    environment={
                      environment
                    }


                    value={
                      parameter.key
                    }


                    placeholder="Key"


                    className="params-key-field"


                    onChange={(event)=>

                      updateParameter(

                        parameter.id,

                        'key',

                        event.target.value

                      )

                    }

                  />


                </div>





                <div className="params-cell-value">


                  <VariableField


                    environment={
                      environment
                    }


                    value={
                      parameter.value
                    }


                    placeholder="Value"


                    className="params-value-field"


                    onChange={(event)=>

                      updateParameter(

                        parameter.id,

                        'value',

                        event.target.value

                      )

                    }

                  />


                </div>





                <div className="params-cell-description">


                  <input


                    value={
                      parameter.description
                    }


                    placeholder="Description"


                    onChange={(event)=>

                      updateParameter(

                        parameter.id,

                        'description',

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


export default ParamsEditor