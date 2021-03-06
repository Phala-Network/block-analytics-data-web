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

      <div
        style={{
          marginTop: 20,
        }}
      >
        <a
          target="_blank"
          href="https://github.com/Phala-Network/block-analytics-data-web"
        >
          Github Code
        </a>
        &nbsp;/&nbsp;
        <a
          target="_blank"
          href="https://app.netlify.com/sites/block-analytics-data-web/overview"
        >
          Netlify Deploy
        </a>
      </div>
    </div>
  )
}
