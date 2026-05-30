import { useMemo } from "react"
import { getMorseTable } from "../utils/morseMap"
import type { GugaMode } from "../utils/morseMap"

type MorseTableProps = {
  mode: GugaMode
}

export default function MorseTable({ mode }: MorseTableProps) {
  const table = useMemo(() => getMorseTable(mode), [mode])

  return (
    <section className="mx-auto mt-8 w-full max-w-5xl rounded-[4px] border border-[#2d3035] bg-[#1e2022] p-4 sm:p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#7d7f84]">
            lookup
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#edecea] sm:text-2xl">摩尔斯对照表</h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#9f9c96]">
          只保留清晰的分割线，让字符、摩尔斯和咕嘎密文一眼对应。
        </p>
      </div>
      <div className="overflow-x-auto rounded-[4px] border border-[#2d3035] bg-[#141618] [-webkit-overflow-scrolling:touch]">
        <table className="min-w-[36rem] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#2d3035] text-[#edecea]">
              <th className="p-3 font-medium">字符</th>
              <th className="p-3 font-medium">摩尔斯电码</th>
              <th className="p-3 font-mono font-medium text-[#e8a020]">咕嘎密文</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2d3035]">
            {table.map((row) => (
              <tr key={row.char}>
                <td className="p-3 font-bold text-[#edecea]">{row.char}</td>
                <td className="p-3 font-mono text-[#c2beb8]">{row.morse}</td>
                <td className="p-3 font-mono text-[#e8a020]">{row.guga}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
