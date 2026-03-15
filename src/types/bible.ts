export interface BibleTranslation {
  translation: string
  books: Book[]
}

export interface Book {
  name: string
  chapters: string[][]
}

export interface PageBlock {
  verseIndex: number
  text: string
}
