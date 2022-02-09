import { ApiPromise } from '@polkadot/api'
import { DateTime } from 'luxon'
import { bn1e10, bn64b } from './bn'
import { createApi } from './createApi'
import { formatDate, formatDateTime } from './date'
import { writeCSV } from './writeCSV'
import { writeJson } from './writeJson'

export async function dumpSnapshots(startNum: number = 1144993) {
  const endpoint = 'wss://khala-node-asia-1.phala.network/ws'

  console.time('init')
  const api = await createApi(endpoint)
  const tip = await api.rpc.chain.getHeader()
  console.timeEnd('init')

  const tipNum = tip.number.toNumber()

  console.time('minerBindings')
  const minerBindings = await api?.query?.phalaMining?.minerBindings?.entries()
  console.timeEnd('minerBindings')

  if (!minerBindings) {
    console.error('minerBindings is null')
    return
  }

  const minerWorkerMap = minerBindings
    .map(([key, v]) => {
      // @ts-ignore
      return [key.args?.[0]?.toHuman(), v?.unwrap?.().toJSON()]
    })
    .reduce((map, [key, v]) => {
      // @ts-ignore
      map[key] = v
      return map
    }, {})

  const input = []

  // Dump miner status
  for (let n = startNum; n <= tipNum; n += 7200) {
    input.push(n)
  }

  let lastReward = 0
  // await input
  for (const n of input) {
    console.time()
    lastReward = (await handleData(api, n, minerWorkerMap, lastReward)) ?? 0
    console.timeEnd()
  }

  api.disconnect()
}

async function handleData(
  api: ApiPromise,
  n: number,
  minerWorkerMap: {},
  lastReward: number
) {
  console.log('n', n)
  const h = await api.rpc.chain.getBlockHash(n)
  const momentPrev = await api.query?.timestamp?.now?.at?.(h)

  if (!momentPrev) {
    console.error('momentPrev is null')
    return
  }

  const momentPrevNumber = parseInt(momentPrev.toString())

  console.log('momentPrev', formatDate(momentPrevNumber))

  const date = formatDate(momentPrevNumber)

  const output2 = `./data/block/block-result-${n}`
  const output = `./data/daily/daily-result-${formatDateTime(momentPrevNumber)}`
  const outputLatest = `./data/latest/daily`

  const entries = await api.query?.phalaMining?.miners?.entriesAt(h)

  const frame = entries?.map(([key, v]) => {
    // @ts-ignore
    const m = v.unwrap()
    const miner = key.args[0]?.toHuman()

    return {
      miner,
      // @ts-ignore
      worker: minerWorkerMap[miner] || '',
      state: m.state.toString(),
      v: m.v.div(bn64b).toNumber(),
      pInit: m.benchmark.pInit.toNumber(),
      pInstant: m.benchmark.pInstant.toNumber(),
      updatedAt: m.benchmark.challengeTimeLast.toNumber(),
      totalReward: m.stats.totalReward.div(bn1e10).toNumber() / 100,
    }
  })

  if (!frame) {
    console.error('frame is null')
    return
  }

  const miningIdles = frame.filter((item) => item.state === 'MiningIdle')
  const reward = frame.reduce((sum, item) => sum + item.totalReward, 0)

  const result = {
    block: n,
    onlineWorkers: miningIdles.length,
    workers: frame.length,
    vCPU: miningIdles.reduce((sum, item) => sum + item.pInstant, 0) / 150,
    date,
    reward,
    dailyReward: reward - lastReward,
    datetime: DateTime.fromMillis(momentPrevNumber).toISO(),
  }

  console.log('result', result)

  writeJson(output2, result)
  writeJson(output, result)
  writeJson(outputLatest, result)
  writeCSV(output2, [result])
  writeCSV(output, [result])
  writeCSV(outputLatest, [result])

  return reward ?? 0
}
