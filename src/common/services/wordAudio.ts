const YOUDAO_DICTVOICE_BASE = 'https://dict.youdao.com/dictvoice'

export function youdaoDictVoiceUrl(word: string): string {
    return `${YOUDAO_DICTVOICE_BASE}?type=0&audio=${encodeURIComponent(word)}`
}

export function resolveAudioSources(word: string, dictionaryAudio: string | undefined): string[] {
    const sources: string[] = []
    if (dictionaryAudio) {
        sources.push(dictionaryAudio)
    }
    sources.push(youdaoDictVoiceUrl(word))
    return sources
}

export function playAudioChain(
    urls: string[],
    onAllFailed: () => void,
    makeAudio: (url: string) => HTMLAudioElement | null = (url) => new Audio(url),
    onEnded?: () => void
): () => void {
    let stopped = false
    let current: HTMLAudioElement | null = null

    const playNext = (index: number) => {
        if (stopped) return
        if (index >= urls.length) {
            onAllFailed()
            return
        }
        const audio = makeAudio(urls[index])
        if (!audio) {
            playNext(index + 1)
            return
        }
        current = audio
        const advance = () => {
            if (current === audio) {
                playNext(index + 1)
            }
        }
        audio.addEventListener('error', advance)
        audio.addEventListener('ended', () => {
            if (current === audio) {
                onEnded?.()
            }
        })
        audio.play().catch(advance)
    }

    playNext(0)

    return () => {
        stopped = true
        current?.pause()
        current = null
    }
}
