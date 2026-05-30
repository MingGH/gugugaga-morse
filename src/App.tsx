import { useState } from "react"
import Converter from "./components/Converter"
import MorseTable from "./components/MorseTable"
import AudioUploader from "./components/AudioUploader"
import type { GugaMode } from "./utils/morseMap"

export default function App() {
  const [mode, setMode] = useState<GugaMode>("single")
  const [gugaSequence, setGugaSequence] = useState("")

  const appendSequence = (nextSequence: string) => {
    const trimmedNext = nextSequence.trim()
    if (!trimmedNext) return

    setGugaSequence((prev) => {
      const trimmedPrev = prev.trim()
      return trimmedPrev ? `${trimmedPrev} ${trimmedNext}` : trimmedNext
    })
  }

  return (
    <div className="min-h-screen bg-[#141618] text-[#edecea]">
      <header className="px-4 pt-[max(3rem,env(safe-area-inset-top))] pb-8 md:pt-14 md:pb-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <h1 className="flex flex-col items-center gap-3 font-mono text-[2rem] font-bold lowercase tracking-[0.12em] text-[#e8a020] sm:flex-row sm:text-4xl sm:tracking-[0.16em] md:text-6xl">
            <span>gugugaga-morse</span>
            <img
              src="/gugu-smile.png"
              alt="gugu smile"
              className="h-12 w-12 rounded-[4px] object-cover sm:h-12 sm:w-12 md:h-16 md:w-16"
            />
          </h1>
          <p className="mt-3 max-w-[20rem] font-mono text-[11px] uppercase tracking-[0.22em] text-[#9f9c96] sm:max-w-none sm:tracking-[0.28em] md:text-xs">
            penguin speaks in dots and dashes
          </p>
        </div>
      </header>

      <main className="px-4 pb-[max(4rem,calc(env(safe-area-inset-bottom)+2rem))]">
        <section className="mx-auto mb-6 flex w-full max-w-5xl flex-col gap-4 rounded-[4px] border border-[#2d3035] bg-[#1e2022] p-4 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="text-left">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#7d7f84]">
              mode
            </p>
            <p className="mt-2 text-sm text-[#9f9c96]">
              选择单音节或双音节模式，转换结果、对照表和默认音频会同步切换。
            </p>
          </div>
          <div className="grid w-full grid-cols-2 rounded-[4px] border border-[#2d3035] bg-[#141618] p-1 sm:flex sm:w-auto">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`min-h-11 rounded-[4px] px-4 py-2 text-sm font-medium transition-colors ${
                mode === "single"
                  ? "bg-[#e8a020] text-[#141618]"
                  : "cursor-pointer text-[#edecea] hover:bg-[#c4850f] hover:text-[#141618]"
              }`}
            >
              单音节
            </button>
            <button
              type="button"
              onClick={() => setMode("double")}
              className={`min-h-11 rounded-[4px] px-4 py-2 text-sm font-medium transition-colors ${
                mode === "double"
                  ? "bg-[#e8a020] text-[#141618]"
                  : "cursor-pointer text-[#edecea] hover:bg-[#c4850f] hover:text-[#141618]"
              }`}
            >
              双音节
            </button>
          </div>
        </section>
        <Converter mode={mode} onAppendToSequence={appendSequence} />
        <AudioUploader
          mode={mode}
          gugaSequence={gugaSequence}
          onSequenceChange={setGugaSequence}
        />
        <MorseTable mode={mode} />
      </main>

      <footer className="border-t border-[#2d3035] px-4 py-6 text-center text-xs tracking-[0.18em] text-[#7d7f84] sm:tracking-[0.2em]">
        round little penguin, serious morse business.
      </footer>
    </div>
  )
}
