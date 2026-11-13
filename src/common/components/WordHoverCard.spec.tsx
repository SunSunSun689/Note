import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, Root } from 'react-dom/client'
import { act } from 'react-dom/test-utils'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))
vi.mock('../hooks/useTheme', async () => {
    const { LightTheme } = await import('baseui-sd/themes')
    return { useTheme: () => ({ theme: LightTheme, themeType: 'light' }) }
})
vi.mock('../hooks/useSettings', () => ({
    useSettings: () => ({ settings: { tts: {} }, isSettingsLoading: false }),
}))

import { HoverableText, WordHoverProvider } from './WordHoverCard'

const dictionaryResponse = [
    {
        word: 'hello',
        phonetics: [{ text: '/həˈloʊ/' }],
        meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'A greeting.' }] }],
    },
]

describe('WordHoverCard click behavior', () => {
    let container: HTMLDivElement
    let root: Root
    let onOpenDetails: ReturnType<typeof vi.fn>

    beforeEach(() => {
        onOpenDetails = vi.fn()
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: () => Promise.resolve(dictionaryResponse),
            })
        )
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        act(() => root.unmount())
        container.remove()
    })

    async function renderProvider() {
        await act(async () => {
            root.render(
                <WordHoverProvider enabled onOpenDetails={onOpenDetails}>
                    <HoverableText>hello world</HoverableText>
                </WordHoverProvider>
            )
        })
    }

    const wordSpan = () => container.querySelector('[role="link"]') as HTMLElement | null
    const card = () => document.body.querySelector('[role="dialog"]')

    // show() 内部用 setTimeout(0) 打开卡片，act 内等待让计时器和查词 fetch 完成
    const openPinnedCard = async () => {
        await act(async () => {
            wordSpan()?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
            await new Promise((resolve) => setTimeout(resolve, 20))
        })
    }

    it('clicking a word opens the card instead of re-translating the word', async () => {
        await renderProvider()
        await openPinnedCard()
        expect(onOpenDetails).not.toHaveBeenCalled()
        expect(card()).not.toBeNull()
    })

    it('keeps the card open when the mouse leaves the word after a click', async () => {
        await renderProvider()
        await openPinnedCard()
        expect(card()).not.toBeNull()
        await act(async () => {
            wordSpan()?.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
        })
        await new Promise((resolve) => setTimeout(resolve, 200))
        expect(card()).not.toBeNull()
    })

    it('closes the pinned card when Escape is pressed', async () => {
        await renderProvider()
        await openPinnedCard()
        expect(card()).not.toBeNull()
        await act(async () => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        })
        expect(card()).toBeNull()
    })

    it('pressing Enter on a word also pins the card without re-translating', async () => {
        await renderProvider()
        await act(async () => {
            wordSpan()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
            await new Promise((resolve) => setTimeout(resolve, 20))
        })
        expect(onOpenDetails).not.toHaveBeenCalled()
        expect(card()).not.toBeNull()
    })

    it('closes the pinned card when clicking outside it', async () => {
        await renderProvider()
        await openPinnedCard()
        expect(card()).not.toBeNull()
        await act(async () => {
            document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        })
        expect(card()).toBeNull()
    })
})
