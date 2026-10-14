import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useState } from "react";

type ExpandingSearchDockProps = {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  inputClassName?: string;
};

export function ExpandingSearchDock({
  onSearch,
  placeholder = "Search...",
  className = "",
  buttonClassName = "",
  inputClassName = "",
}: ExpandingSearchDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="icon"
            type="button"
            aria-label="Open search"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={handleExpand}
            className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-muted ${buttonClassName}`}
          >
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.button>
        ) : (
          <motion.form
            key="input"
            initial={{ width: 44, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 44, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            onSubmit={handleSubmit}
            className="relative"
          >
            <motion.div
              initial={{ backdropFilter: "blur(0px)" }}
              animate={{ backdropFilter: "blur(12px)" }}
              className={`relative flex items-center gap-2 overflow-hidden rounded-full border border-border bg-card/80 backdrop-blur-md ${inputClassName}`}
            >
              <div className="ml-3 sm:ml-4">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                autoFocus
                className="h-10 sm:h-12 flex-1 bg-transparent pr-3 sm:pr-4 text-xs sm:text-sm outline-none placeholder:text-muted-foreground"
              />
              <motion.button
                type="button"
                aria-label="Close search"
                onClick={handleCollapse}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="mr-1.5 sm:mr-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </motion.button>
            </motion.div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
