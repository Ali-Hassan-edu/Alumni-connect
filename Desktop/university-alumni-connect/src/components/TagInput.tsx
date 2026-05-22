// src/components/TagInput.tsx
import { useState } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  tags: string[] | undefined
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
  placeholder?: string
}

export function TagInput({ tags, onAdd, onRemove, placeholder = 'Add a tag...' }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  // Guard: ensure tags is always an array even if undefined is passed
  const safeTags: string[] = Array.isArray(tags) ? tags : []

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        onAdd(inputValue.trim())
        setInputValue('')
      }
    } else if (e.key === 'Backspace' && !inputValue && safeTags.length > 0) {
      onRemove(safeTags[safeTags.length - 1])
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-border bg-background min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500">
        {safeTags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="hover:opacity-70 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={safeTags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] outline-none bg-transparent text-sm"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">Press Enter to add tags, Backspace to remove</p>
    </div>
  )
}
