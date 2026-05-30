import { useCallback, useEffect, useState } from "react"
import { textToGuga, gugaToText } from "../utils/converter"
import type { GugaMode } from "../utils/morseMap"

type Direction = "text2guga" | "guga2text"
type CopyStatus = "idle" | "success" | "error"

type ConverterProps = {
  mode: GugaMode
  onAppendToSequence: (sequence: string) => void
}

export default function Converter({ mode, onAppendToSequence }: ConverterProps) {
  const [direction, setDirection] = useState<Direction>("text2guga")
  const [input, setInput] = useState("hello")
  const [output, setOutput] = useState(() => textToGuga("hello", mode))
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle")
  const [fillStatus, setFillStatus] = useState<CopyStatus>("idle")

  const handleInput = useCallback(
    (value: string) => {
      setInput(value)
      if (direction === "text2guga") {
        setOutput(textToGuga(value, mode))
      } else {
        setOutput(gugaToText(value, mode))
      }
    },
    [direction, mode]
  )

  const swapDirection = useCallback(() => {
    setDirection((prev) => {
      const next: Direction = prev === "text2guga" ? "guga2text" : "text2guga"
      setCopyStatus("idle")
      setFillStatus("idle")
      if (next === "text2guga") {
        setInput(output)
        setOutput(textToGuga(output, mode))
      } else {
        setInput(output)
        setOutput(gugaToText(output, mode))
      }
      return next
    })
  }, [mode, output])

  const handleCopy = useCallback(async () => {
    if (!output) return

    try {
      await navigator.clipboard.writeText(output)
      setCopyStatus("success")
    } catch {
      setCopyStatus("error")
    }

    window.setTimeout(() => setCopyStatus("idle"), 2000)
  }, [output])

  const handleAppendToSequence = useCallback(() => {
    if (!output) return

    onAppendToSequence(output)
    setFillStatus("success")
    window.setTimeout(() => setFillStatus("idle"), 2000)
  }, [onAppendToSequence, output])

  useEffect(() => {
    if (!input) {
      setOutput("")
      return
    }

    if (direction === "text2guga") {
      setOutput(textToGuga(input, mode))
    } else {
      setOutput(gugaToText(input, mode))
    }
  }, [direction, input, mode])

  const inputLabel = direction === "text2guga" ? "输入文字" : "输入咕嘎密文"
  const outputLabel = direction === "text2guga" ? "咕嘎密文" : "解码文字"
  const inputPlaceholder =
    direction === "text2guga"
      ? "输入文字，如：HELLO WORLD 或 你好世界"
      : mode === "single"
        ? "输入咕嘎密文，如：咕咕咕咕 咕 咕嘎咕咕 咕嘎咕咕 嘎嘎嘎 / 咕嘎嘎 嘎嘎嘎 咕嘎咕 咕嘎咕咕 嘎咕咕"
        : "输入咕嘎密文，如：咕咕咕咕咕咕咕咕 咕咕 咕咕嘎嘎咕咕咕咕 / 嘎嘎咕咕咕咕"

  return (
    <section className="mx-auto w-full max-w-5xl rounded-[4px] border border-[#2d3035] bg-[#1e2022] p-4 sm:p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#7d7f84]">
            convert
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#edecea] sm:text-2xl">
            咕嘎密文双向转换
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#9f9c96]">
          黑白黄配色下的一只企鹅，把文字和咕嘎节奏互相翻译。
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex flex-col gap-1.5">
          <div className="flex min-h-11 items-center">
            <label className="text-sm font-medium text-[#e8a020]">{inputLabel}</label>
          </div>
          <textarea
            className="h-40 w-full rounded-[4px] border border-[#2d3035] bg-[#141618] p-3 font-mono text-base text-[#edecea] placeholder-[#6f7378] focus:outline-none focus:border-[#e8a020] sm:h-44 sm:text-sm"
            placeholder={inputPlaceholder}
            value={input}
            onChange={(e) => handleInput(e.target.value)}
          />
        </div>

        <button
          onClick={swapDirection}
          className="mx-auto flex min-h-11 w-full max-w-full shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-[#edecea] bg-transparent px-4 text-xl text-[#edecea] transition-colors hover:border-[#c4850f] hover:bg-[#c4850f] hover:text-[#141618] md:mt-7 md:h-10 md:w-10 md:px-0"
          title="切换方向"
        >
          &#8645;
        </button>

        <div className="flex flex-col gap-1.5">
          <div className="flex min-h-11 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-sm font-medium text-[#e8a020]">{outputLabel}</label>
            {direction === "text2guga" && (
              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  onClick={handleAppendToSequence}
                  disabled={!output}
                  className="min-h-11 cursor-pointer rounded-[4px] border border-[#edecea] bg-transparent px-3 py-2 text-xs font-medium text-[#edecea] transition-colors hover:border-[#c4850f] hover:bg-[#c4850f] hover:text-[#141618] disabled:cursor-not-allowed disabled:border-[#43474d] disabled:text-[#696d73] disabled:hover:bg-transparent disabled:hover:text-[#696d73]"
                >
                  {fillStatus === "success" ? "已填入" : "填入下方咕嘎序列"}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!output}
                  className="min-h-11 cursor-pointer rounded-[4px] border border-[#edecea] bg-transparent px-3 py-2 text-xs font-medium text-[#edecea] transition-colors hover:border-[#c4850f] hover:bg-[#c4850f] hover:text-[#141618] disabled:cursor-not-allowed disabled:border-[#43474d] disabled:text-[#696d73] disabled:hover:bg-transparent disabled:hover:text-[#696d73]"
                >
                  {copyStatus === "success"
                    ? "已复制"
                    : copyStatus === "error"
                      ? "复制失败"
                      : "复制"}
                </button>
              </div>
            )}
          </div>
          <textarea
            className="h-40 w-full rounded-[4px] border border-[#2d3035] bg-[#141618] p-3 font-mono text-base text-[#e8a020] focus:outline-none focus:border-[#e8a020] resize-none sm:h-44 sm:text-sm"
            placeholder="转换结果将显示在这里..."
            value={output}
            readOnly
          />
        </div>
      </div>
    </section>
  )
}
