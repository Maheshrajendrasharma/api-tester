import RunnerPanel from './Runner/RunnerPanel'
export default function RunnerScreen(props){

console.log(
  "RUNNER SCREEN PROPS",
  props
)

return (
  <RunnerPanel
    {...props}
  />
)

}