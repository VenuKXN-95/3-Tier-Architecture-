/**
 * CategoryFilter — horizontal scrolling category pill filter.
 * Motion stagger animation on mount.
 */
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

interface CategoryFilterProps {
  categories: Category[]
  selected: string | null
  onSelect: (id: string | null) => void
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide"
      role="group"
      aria-label="Filter by category"
    >
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        onClick={() => onSelect(null)}
        aria-pressed={selected === null}
        className={cn(
          'px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all shrink-0',
          selected === null
            ? 'bg-violet/15 text-violet-bright border-violet/20'
            : 'bg-canvas-2 text-text-3 border-white/[0.06] hover:text-text-1',
        )}
      >
        All
      </motion.button>

      {categories.map((cat, i) => (
        <motion.button
          key={cat.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15, delay: i * 0.04 }}
          onClick={() => onSelect(cat.id)}
          aria-pressed={selected === cat.id}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all shrink-0',
            selected === cat.id
              ? 'bg-violet/15 text-violet-bright border-violet/20'
              : 'bg-canvas-2 text-text-3 border-white/[0.06] hover:text-text-1',
          )}
        >
          {cat.name}
        </motion.button>
      ))}
    </div>
  )
}
