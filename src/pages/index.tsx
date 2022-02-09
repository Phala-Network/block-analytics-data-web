import { useState } from 'react'
import { dumpSnapshots } from '../dataScripts/dumpSnapshots'

export default () => {
  const [block, setBlock] = useState('')

  function run() {
    import('vconsole').then(({ default: VConsole }) => {
      const vConsole = new VConsole()

      setTimeout(() => {
        vConsole?.show()
      }, 1500)
    })

    dumpSnapshots(parseInt(block))
  }

  return (
    <div id="log">
      <input
        style={{
          fontSize: 30,
          padding: 12,
        }}
        type="text"
        placeholder="block"
        value={block}
        onChange={(e) => setBlock(e.target.value)}
      />
      <button
        style={{
          fontSize: 30,
          padding: 12,
        }}
        onClick={run}
      >
        Run
      </button>
    </div>
  )
}
