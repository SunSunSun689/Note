import { describe, expect, it, vi } from 'vitest'
import { parseDictionaryResponse } from './wordLookup'
import { playAudioChain, resolveAudioSources, youdaoDictVoiceUrl } from './wordAudio'

describe('parseDictionaryResponse', () => {
    it('creates a compact preview with phonetics, meanings, examples, and attribution', () => {
        expect(
            parseDictionaryResponse(
                [
                    {
                        word: 'elegant',
                        phonetics: [{ text: '/ˈɛl.ə.ɡənt/' }],
                        meanings: [
                            {
                                partOfSpeech: 'adjective',
                                definitions: [
                                    {
                                        definition: 'Characterised by elegance.',
                                    },
                                    {
                                        definition: 'Refined and graceful.',
                                        example: 'An elegant solution.',
                                    },
                                ],
                            },
                            {
                                partOfSpeech: 'noun',
                                definitions: [{ definition: 'A refined person.' }],
                            },
                            {
                                partOfSpeech: 'adverb',
                                definitions: [{ definition: 'A third result that should not be displayed.' }],
                            },
                        ],
                        sourceUrls: ['https://en.wiktionary.org/wiki/elegant'],
                    },
                ],
                'Elegant'
            )
        ).toEqual({
            word: 'elegant',
            phonetic: '/ˈɛl.ə.ɡənt/',
            meanings: [
                {
                    partOfSpeech: 'adjective',
                    definition: 'Characterised by elegance.',
                    example: 'An elegant solution.',
                },
                {
                    partOfSpeech: 'noun',
                    definition: 'A refined person.',
                    example: undefined,
                },
            ],
            sourceUrl: 'https://en.wiktionary.org/wiki/elegant',
        })
    })

    it('returns null for an empty or unusable dictionary response', () => {
        expect(parseDictionaryResponse([], 'missing')).toBeNull()
        expect(parseDictionaryResponse([{ meanings: [] }], 'missing')).toBeNull()
    })

    it('extracts the first non-empty pronunciation audio URL', () => {
        expect(
            parseDictionaryResponse(
                [
                    {
                        word: 'translate',
                        phonetic: '/tɹænzˈleɪt/',
                        phonetics: [
                            { text: '/tɹænzˈleɪt/', audio: '' },
                            {
                                text: '/tɹænzˈleɪt/',
                                audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/translate-us.mp3',
                            },
                        ],
                        meanings: [
                            {
                                partOfSpeech: 'verb',
                                definitions: [{ definition: 'To render in another language.' }],
                            },
                        ],
                    },
                ],
                'translate'
            )?.audio
        ).toBe('https://api.dictionaryapi.dev/media/pronunciations/en/translate-us.mp3')
    })

    it('leaves audio undefined when the dictionary has no pronunciation audio', () => {
        expect(
            parseDictionaryResponse(
                [
                    {
                        word: 'hello',
                        phonetic: '/həˈloʊ/',
                        phonetics: [{ text: '/həˈloʊ/', audio: '' }],
                        meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'A greeting.' }] }],
                    },
                ],
                'hello'
            )?.audio
        ).toBeUndefined()
    })
})

describe('youdaoDictVoiceUrl', () => {
    it('builds a US-pronunciation Youdao audio URL by default', () => {
        expect(youdaoDictVoiceUrl('hello')).toBe('https://dict.youdao.com/dictvoice?type=0&audio=hello')
    })

    it('URL-encodes words with spaces and punctuation', () => {
        expect(youdaoDictVoiceUrl('ice cream')).toBe('https://dict.youdao.com/dictvoice?type=0&audio=ice%20cream')
    })
})

describe('resolveAudioSources', () => {
    it('prefers the dictionary original audio and appends Youdao as fallback', () => {
        expect(
            resolveAudioSources('translate', 'https://api.dictionaryapi.dev/media/pronunciations/en/translate-us.mp3')
        ).toEqual([
            'https://api.dictionaryapi.dev/media/pronunciations/en/translate-us.mp3',
            'https://dict.youdao.com/dictvoice?type=0&audio=translate',
        ])
    })

    it('falls back to Youdao alone when the dictionary has no audio', () => {
        expect(resolveAudioSources('hello', undefined)).toEqual([
            'https://dict.youdao.com/dictvoice?type=0&audio=hello',
        ])
    })
})

interface FakeAudioElement {
    url: string
    played: boolean
    paused: boolean
    addEventListener: (type: string, cb: () => void) => void
    play: () => Promise<void>
    pause: () => void
    fire: (type: string) => void
}

function fakeAudioElement(behavior: 'ok' | 'fail'): FakeAudioElement {
    const listeners = new Map<string, () => void>()
    const audio: FakeAudioElement = {
        url: '',
        played: false,
        paused: false,
        addEventListener(type, cb) {
            listeners.set(type, cb)
        },
        play() {
            audio.played = true
            if (behavior === 'fail') {
                queueMicrotask(() => listeners.get('error')?.())
            }
            return Promise.resolve()
        },
        pause() {
            audio.paused = true
        },
        fire(type) {
            listeners.get(type)?.()
        },
    }
    return audio
}

const asAudioElement = (audio: FakeAudioElement) => audio as unknown as HTMLAudioElement

async function waitFor(predicate: () => boolean) {
    for (let i = 0; i < 20 && !predicate(); i++) {
        await new Promise((resolve) => setTimeout(resolve, 5))
    }
    expect(predicate()).toBe(true)
}

describe('playAudioChain', () => {
    it('stops at the first source that plays successfully', () => {
        const first = fakeAudioElement('ok')
        const second = fakeAudioElement('ok')
        const onAllFailed = vi.fn()
        playAudioChain(['https://first.mp3', 'https://second.mp3'], onAllFailed, () => asAudioElement(first))
        expect(first.played).toBe(true)
        expect(second.played).toBe(false)
        expect(onAllFailed).not.toHaveBeenCalled()
    })

    it('moves to the next source when one fails to play', async () => {
        const first = fakeAudioElement('fail')
        const second = fakeAudioElement('ok')
        const onAllFailed = vi.fn()
        playAudioChain(['https://first.mp3', 'https://second.mp3'], onAllFailed, (url) =>
            asAudioElement(url === 'https://first.mp3' ? first : second)
        )
        await waitFor(() => second.played)
        expect(onAllFailed).not.toHaveBeenCalled()
    })

    it('calls onAllFailed when every source fails', async () => {
        const onAllFailed = vi.fn()
        playAudioChain(['https://first.mp3', 'https://second.mp3'], onAllFailed, () =>
            asAudioElement(fakeAudioElement('fail'))
        )
        await waitFor(() => onAllFailed.mock.calls.length === 1)
    })

    it('notifies onEnded when the playing source finishes naturally', () => {
        const first = fakeAudioElement('ok')
        const onAllFailed = vi.fn()
        const onEnded = vi.fn()
        playAudioChain(['https://first.mp3'], onAllFailed, () => asAudioElement(first), onEnded)
        first.fire('ended')
        expect(onEnded).toHaveBeenCalledTimes(1)
    })

    it('does not call onEnded when a source fails', async () => {
        const onAllFailed = vi.fn()
        const onEnded = vi.fn()
        playAudioChain(['https://first.mp3'], onAllFailed, () => asAudioElement(fakeAudioElement('fail')), onEnded)
        await waitFor(() => onAllFailed.mock.calls.length === 1)
        expect(onEnded).not.toHaveBeenCalled()
    })

    it('stop pauses the current source and suppresses onAllFailed', async () => {
        const first = fakeAudioElement('fail')
        const second = fakeAudioElement('fail')
        const onAllFailed = vi.fn()
        const stop = playAudioChain(['https://first.mp3', 'https://second.mp3'], onAllFailed, (url) =>
            asAudioElement(url === 'https://first.mp3' ? first : second)
        )
        stop()
        expect(first.paused).toBe(true)
        await new Promise((resolve) => setTimeout(resolve, 0))
        expect(onAllFailed).not.toHaveBeenCalled()
    })
})
