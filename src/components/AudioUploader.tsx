import { useCallback, useEffect, useRef, useState } from "react"
import type { GugaMode } from "../utils/morseMap"

const DEFAULT_AUDIO: Record<GugaMode, { dotUrl: string; dashUrl: string }> = {
  single: { dotUrl: "/gu.mp3", dashUrl: "/ga.mp3" },
  double: { dotUrl: "/gugu.mp3", dashUrl: "/gaga.mp3" },
}

const WORD_GAP_SECONDS = 0.7
const TOKEN_GAP_SECONDS = 0.3

type DownloadStatus = "idle" | "processing" | "success" | "error"

function revokeBlobUrl(url: string | null) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url)
  }
}

function tokenizeSyllables(token: string, mode: GugaMode): Array<"dot" | "dash"> {
  if (mode === "double") {
    const units: string[] = token.match(/咕咕|嘎嘎/g) ?? []
    if (units.join("") !== token) return []
    return units.map((unit) => (unit === "咕咕" ? "dot" : "dash"))
  }

  return [...token]
    .filter((char) => char === "咕" || char === "嘎")
    .map((char) => (char === "咕" ? "dot" : "dash"))
}

async function fetchAudioBuffer(audioContext: AudioContext, url: string): Promise<AudioBuffer> {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  return audioContext.decodeAudioData(arrayBuffer.slice(0))
}

function encodeWav(audioBuffer: AudioBuffer): Blob {
  const numberOfChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const samples = audioBuffer.length
  const bytesPerSample = 2
  const blockAlign = numberOfChannels * bytesPerSample
  const buffer = new ArrayBuffer(44 + samples * blockAlign)
  const view = new DataView(buffer)

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i))
    }
  }

  writeString(0, "RIFF")
  view.setUint32(4, 36 + samples * blockAlign, true)
  writeString(8, "WAVE")
  writeString(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(36, "data")
  view.setUint32(40, samples * blockAlign, true)

  let offset = 44
  for (let i = 0; i < samples; i += 1) {
    for (let channel = 0; channel < numberOfChannels; channel += 1) {
      const sample = audioBuffer.getChannelData(channel)[i] ?? 0
      const clamped = Math.max(-1, Math.min(1, sample))
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true)
      offset += bytesPerSample
    }
  }

  return new Blob([buffer], { type: "audio/wav" })
}

async function buildMergedAudio(
  dotUrl: string,
  dashUrl: string,
  sequence: string,
  mode: GugaMode
): Promise<Blob> {
  const audioContext = new AudioContext()

  try {
    const [dotBuffer, dashBuffer] = await Promise.all([
      fetchAudioBuffer(audioContext, dotUrl),
      fetchAudioBuffer(audioContext, dashUrl),
    ])

    const tokens = sequence.trim().split(/\s+/)
    const channels = Math.max(dotBuffer.numberOfChannels, dashBuffer.numberOfChannels)
    const sampleRate = Math.max(dotBuffer.sampleRate, dashBuffer.sampleRate)

    let totalDuration = 0
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i]
      if (token === "/") {
        totalDuration += WORD_GAP_SECONDS
        continue
      }

      for (const syllable of tokenizeSyllables(token, mode)) {
        totalDuration += syllable === "dot" ? dotBuffer.duration : dashBuffer.duration
      }

      if (i < tokens.length - 1 && tokens[i + 1] !== "/") {
        totalDuration += TOKEN_GAP_SECONDS
      }
    }

    const offlineContext = new OfflineAudioContext(
      channels,
      Math.max(1, Math.ceil(totalDuration * sampleRate)),
      sampleRate
    )

    let currentTime = 0
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i]
      if (token === "/") {
        currentTime += WORD_GAP_SECONDS
        continue
      }

      for (const syllable of tokenizeSyllables(token, mode)) {
        const source = offlineContext.createBufferSource()
        const buffer = syllable === "dot" ? dotBuffer : dashBuffer
        source.buffer = buffer
        source.connect(offlineContext.destination)
        source.start(currentTime)
        currentTime += buffer.duration
      }

      if (i < tokens.length - 1 && tokens[i + 1] !== "/") {
        currentTime += TOKEN_GAP_SECONDS
      }
    }

    const renderedBuffer = await offlineContext.startRendering()
    return encodeWav(renderedBuffer)
  } finally {
    await audioContext.close()
  }
}

type AudioUploaderProps = {
  mode: GugaMode
  gugaSequence: string
  onSequenceChange: (sequence: string) => void
}

export default function AudioUploader({
  mode,
  gugaSequence,
  onSequenceChange,
}: AudioUploaderProps) {
  const [dotFile, setDotFile] = useState<File | null>(null)
  const [dashFile, setDashFile] = useState<File | null>(null)
  const [dotUrl, setDotUrl] = useState<string>(DEFAULT_AUDIO.single.dotUrl)
  const [dashUrl, setDashUrl] = useState<string>(DEFAULT_AUDIO.single.dashUrl)
  const [isPlaying, setIsPlaying] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle")
  const stopRef = useRef(false)
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null)
  const playbackUrlRef = useRef<string | null>(null)

  const cleanupPlayback = useCallback(() => {
    playbackAudioRef.current?.pause()
    playbackAudioRef.current = null
    if (playbackUrlRef.current) {
      URL.revokeObjectURL(playbackUrlRef.current)
      playbackUrlRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!dotFile) {
      setDotUrl(DEFAULT_AUDIO[mode].dotUrl)
    }
    if (!dashFile) {
      setDashUrl(DEFAULT_AUDIO[mode].dashUrl)
    }
  }, [dashFile, dotFile, mode])

  const handleDotUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDotFile(file)
      revokeBlobUrl(dotUrl)
      setDotUrl(URL.createObjectURL(file))
    }
  }, [dotUrl])

  const handleDashUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setDashFile(file)
      revokeBlobUrl(dashUrl)
      setDashUrl(URL.createObjectURL(file))
    }
  }, [dashUrl])

  const canPlay = dotUrl && dashUrl && gugaSequence.trim().length > 0

  const handlePlay = useCallback(async () => {
    if (!canPlay || !dotUrl || !dashUrl) return

    setIsPlaying(true)
    stopRef.current = false

    try {
      cleanupPlayback()
      const mergedBlob = await buildMergedAudio(dotUrl, dashUrl, gugaSequence.trim(), mode)
      if (stopRef.current) {
        setIsPlaying(false)
        return
      }

      const playbackUrl = URL.createObjectURL(mergedBlob)
      const audio = new Audio(playbackUrl)
      playbackAudioRef.current = audio
      playbackUrlRef.current = playbackUrl

      audio.onended = () => {
        cleanupPlayback()
        setIsPlaying(false)
      }
      audio.onerror = () => {
        cleanupPlayback()
        setIsPlaying(false)
      }

      await audio.play()
    } catch {
      cleanupPlayback()
      setIsPlaying(false)
    }
  }, [canPlay, cleanupPlayback, dashUrl, dotUrl, gugaSequence, mode])

  const handleStop = useCallback(() => {
    stopRef.current = true
    cleanupPlayback()
    setIsPlaying(false)
  }, [cleanupPlayback])

  const handleDownloadSequence = useCallback(async () => {
    const content = gugaSequence.trim()
    if (!content || !dotUrl || !dashUrl) return

    setDownloadStatus("processing")

    try {
      const mergedBlob = await buildMergedAudio(dotUrl, dashUrl, content, mode)
      const url = URL.createObjectURL(mergedBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `gugugaga-audio-${mode === "single" ? "single" : "double"}.wav`
      link.click()
      URL.revokeObjectURL(url)
      setDownloadStatus("success")
    } catch {
      setDownloadStatus("error")
    }

    window.setTimeout(() => setDownloadStatus("idle"), 2500)
  }, [dashUrl, dotUrl, gugaSequence, mode])

  return (
    <section className="mx-auto mt-8 w-full max-w-5xl rounded-[4px] border border-[#2d3035] bg-[#1e2022] p-4 sm:p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#7d7f84]">
            soundboard
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#edecea] sm:text-2xl">咕嘎音效播放</h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#9f9c96]">
          给咕和嘎各自上传声音，让这只企鹅把密文真的念出来。
        </p>
      </div>

      <div className="rounded-[4px] border border-[#2d3035] bg-[#141618] p-4">
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(260px,1.4fr)] lg:items-start">
          <div className="flex min-w-0 flex-col gap-1">
            <label className="text-xs text-[#9f9c96]">
              {dotFile
                ? `咕音: ${dotFile.name}`
                : `默认咕音 (${mode === "single" ? "单音节" : "双音节"}) · 可上传替换`}
            </label>
            <input
              type="file"
              accept="audio/mp3,audio/mpeg"
              onChange={handleDotUpload}
              className="text-base text-[#b8b4ae] file:mr-3 file:mb-2 file:cursor-pointer file:rounded-[4px] file:border file:border-[#edecea] file:bg-transparent file:px-3 file:py-2 file:text-sm file:text-[#edecea] file:transition-colors hover:file:border-[#c4850f] hover:file:bg-[#c4850f] hover:file:text-[#141618] sm:text-sm"
            />
            <audio controls src={dotUrl} className="mt-2 h-10 w-full" />
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <label className="text-xs text-[#9f9c96]">
              {dashFile
                ? `嘎音: ${dashFile.name}`
                : `默认嘎音 (${mode === "single" ? "单音节" : "双音节"}) · 可上传替换`}
            </label>
            <input
              type="file"
              accept="audio/mp3,audio/mpeg"
              onChange={handleDashUpload}
              className="text-base text-[#b8b4ae] file:mr-3 file:mb-2 file:cursor-pointer file:rounded-[4px] file:border file:border-[#edecea] file:bg-transparent file:px-3 file:py-2 file:text-sm file:text-[#edecea] file:transition-colors hover:file:border-[#c4850f] hover:file:bg-[#c4850f] hover:file:text-[#141618] sm:text-sm"
            />
            <audio controls src={dashUrl} className="mt-2 h-10 w-full" />
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <label className="text-xs text-[#9f9c96]">咕嘎序列</label>
            <textarea
              value={gugaSequence}
              onChange={(e) => onSequenceChange(e.target.value)}
              placeholder={
                mode === "single"
                  ? "输入咕嘎序列，如：咕咕咕咕 咕 咕嘎咕咕"
                  : "输入咕嘎序列，如：咕咕咕咕咕咕 咕咕 嘎嘎咕咕"
              }
              className="min-h-40 rounded-[4px] border border-[#2d3035] bg-[#1e2022] px-3 py-3 font-mono text-base leading-7 text-[#e8a020] placeholder-[#6f7378] focus:outline-none focus:border-[#e8a020] sm:min-h-36 sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
          <button
            onClick={handlePlay}
            disabled={!canPlay || isPlaying}
            className="min-h-11 cursor-pointer rounded-[4px] border border-[#edecea] bg-transparent px-4 py-2 text-sm font-medium text-[#edecea] transition-colors hover:border-[#c4850f] hover:bg-[#c4850f] hover:text-[#141618] disabled:cursor-not-allowed disabled:border-[#43474d] disabled:text-[#696d73] disabled:hover:bg-transparent disabled:hover:text-[#696d73]"
          >
            {isPlaying ? "播放中..." : "播放"}
          </button>
          <button
            onClick={handleStop}
            disabled={!isPlaying}
            className="min-h-11 cursor-pointer rounded-[4px] border border-[#edecea] bg-transparent px-4 py-2 text-sm font-medium text-[#edecea] transition-colors hover:border-[#c4850f] hover:bg-[#c4850f] hover:text-[#141618] disabled:cursor-not-allowed disabled:border-[#43474d] disabled:text-[#696d73] disabled:hover:bg-transparent disabled:hover:text-[#696d73]"
          >
            停止
          </button>
          <button
            onClick={handleDownloadSequence}
            disabled={!gugaSequence.trim() || downloadStatus === "processing"}
            className="min-h-11 cursor-pointer rounded-[4px] border border-[#edecea] bg-transparent px-4 py-2 text-sm font-medium text-[#edecea] transition-colors hover:border-[#c4850f] hover:bg-[#c4850f] hover:text-[#141618] disabled:cursor-not-allowed disabled:border-[#43474d] disabled:text-[#696d73] disabled:hover:bg-transparent disabled:hover:text-[#696d73]"
          >
            {downloadStatus === "processing"
              ? "合并中..."
              : downloadStatus === "success"
                ? "已下载音频"
                : downloadStatus === "error"
                  ? "下载失败"
                  : "合并音频下载"}
          </button>
          {!canPlay && !isPlaying && (
            <span className="self-center text-xs text-[#7d7f84]">
              {mode === "single"
                ? "默认单音节音频已就绪，输入咕嘎序列后可直接播放"
                : "默认双音节音频已就绪，输入咕嘎序列后可直接播放"}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
