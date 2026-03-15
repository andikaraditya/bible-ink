"use client"

import { useEffect, useRef, useState } from "react"
import bibleData from "@/data/kjv.json"
import { BibleTranslation } from "@/types/bible"

const bible = bibleData as BibleTranslation

type Align = "left" | "right" | "justify"

export default function Reader() {
  const containerRef = useRef<HTMLDivElement>(null)

  const [bookIndex, setBookIndex] = useState(0)
  const [chapterIndex, setChapterIndex] = useState(0)

  const [fontSize, setFontSize] = useState(22)
  const [textAlign, setTextAlign] = useState<Align>("left")

  const [menuOpen, setMenuOpen] = useState(false)

  const [pages, setPages] = useState<number[][]>([])
  const [pageIndex, setPageIndex] = useState(0)

  const book = bible.books[bookIndex]
  const chapter = book.chapters[chapterIndex]

  /* ---------------- load settings ---------------- */

  useEffect(() => {
    const savedFont = localStorage.getItem("fontSize")
    const savedAlign = localStorage.getItem("textAlign")

    if (savedFont) setFontSize(Number(savedFont))
    if (savedAlign) setTextAlign(savedAlign as Align)
  }, [])

  useEffect(() => {
    localStorage.setItem("fontSize", String(fontSize))
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem("textAlign", textAlign)
  }, [textAlign])

  /* ---------------- pagination engine ---------------- */

  const paginate = () => {
    if (!containerRef.current) return

    const width = containerRef.current.offsetWidth
    const heightLimit = window.innerHeight - 120

    const temp = document.createElement("div")

    temp.style.position = "absolute"
    temp.style.visibility = "hidden"
    temp.style.width = width + "px"
    temp.style.fontSize = fontSize + "px"
    temp.style.lineHeight = "1.6"
    temp.style.fontFamily = "serif"

    document.body.appendChild(temp)

    const pages: { verseIndex: number; text: string }[][] = []

    let page: { verseIndex: number; text: string }[] = []
    let height = 0

    chapter.forEach((verse, verseIndex) => {
      const words = verse.split(" ")

      let buffer = ""

      words.forEach((word, i) => {
        const candidate = buffer + (buffer ? " " : "") + word

        const el = document.createElement("p")
        el.innerText = `${verseIndex + 1} ${candidate}`

        temp.appendChild(el)
        const h = el.offsetHeight
        temp.removeChild(el)

        if (height + h > heightLimit && buffer.length > 0) {
          page.push({
            verseIndex,
            text: buffer,
          })

          pages.push(page)
          page = []
          height = 0
          buffer = word
        } else {
          buffer = candidate
        }

        if (i === words.length - 1) {
          const el2 = document.createElement("p")
          el2.innerText = `${verseIndex + 1} ${buffer}`

          temp.appendChild(el2)
          const h2 = el2.offsetHeight
          temp.removeChild(el2)

          page.push({
            verseIndex,
            text: buffer,
          })

          height += h2
        }
      })
    })

    if (page.length) pages.push(page)

    document.body.removeChild(temp)

    setPages(pages)
    setPageIndex(0)
  }
  /* recompute on changes */

  useEffect(() => {
    paginate()
  }, [fontSize, chapterIndex, bookIndex])

  /* recompute on screen resize */

  useEffect(() => {
    const handler = () => paginate()

    window.addEventListener("resize", handler)

    return () => window.removeEventListener("resize", handler)
  }, [fontSize, chapterIndex])

  /* ---------------- navigation ---------------- */

  const next = () => {
    if (pageIndex < pages.length - 1) {
      setPageIndex(pageIndex + 1)
      return
    }

    if (chapterIndex < book.chapters.length - 1) {
      setChapterIndex(chapterIndex + 1)
      return
    }

    if (bookIndex < bible.books.length - 1) {
      setBookIndex(bookIndex + 1)
      setChapterIndex(0)
    }
  }

  const prev = () => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1)
      return
    }

    if (chapterIndex > 0) {
      setChapterIndex(chapterIndex - 1)
      return
    }

    if (bookIndex > 0) {
      const prevBook = bookIndex - 1
      setBookIndex(prevBook)
      setChapterIndex(bible.books[prevBook].chapters.length - 1)
    }
  }

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const width = window.innerWidth
    const x = e.clientX

    if (menuOpen) {
      setMenuOpen(false)
      return
    }

    if (x < width * 0.33) prev()
    else if (x > width * 0.66) next()
  }

  const currentPage = pages[pageIndex] || []

  /* ---------------- UI ---------------- */

  return (
    <div className="h-screen overflow-hidden" onClick={handleTap}>
      <main ref={containerRef} className="mx-auto max-w-2xl px-8 pt-8" style={{ fontSize }}>
        {/* header */}

        <div className="flex justify-between mb-6">
          <div className="text-lg font-semibold">
            {book.name} {chapterIndex + 1}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
          >
            ☰
          </button>
        </div>

        {/* settings */}

        {menuOpen && (
          <div onClick={(e) => e.stopPropagation()} className="border p-4 mb-6 text-sm space-y-4">
            <div>
              <div className="mb-2 font-semibold">Font Size</div>

              <div className="flex gap-3 items-center">
                <button
                  className="border px-3 py-1"
                  onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                >
                  A-
                </button>

                <div>{fontSize}</div>

                <button
                  className="border px-3 py-1"
                  onClick={() => setFontSize((s) => Math.min(60, s + 2))}
                >
                  A+
                </button>
              </div>
            </div>

            <div>
              <div className="mb-2 font-semibold">Text Align</div>

              <div className="flex gap-2">
                <button className="border px-2 py-1" onClick={() => setTextAlign("left")}>
                  Left
                </button>

                <button className="border px-2 py-1" onClick={() => setTextAlign("right")}>
                  Right
                </button>

                <button className="border px-2 py-1" onClick={() => setTextAlign("justify")}>
                  Justify
                </button>
              </div>
            </div>
          </div>
        )}

        {/* verses */}

        <div className="font-serif leading-relaxed space-y-4" style={{ textAlign }}>
          {currentPage.map((block, i) => (
            <p key={i}>
              <sup className="mr-1 text-sm">{block.verseIndex + 1}</sup>
              {block.text}
            </p>
          ))}
        </div>
      </main>
    </div>
  )
}
