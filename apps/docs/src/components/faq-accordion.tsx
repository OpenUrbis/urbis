"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "src/lib/cn";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4 max-w-[900px] mx-auto">
      {items.map((item, index) => (
        <motion.div
          key={item.question}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            "group relative rounded-lg border transition-all duration-200",
            openIndex === index
              ? "border-border bg-card shadow-lg shadow-neutral-500/10"
              : "border-border hover:border-brand-400/30 bg-card/50 hover:bg-card/80",
          )}
        >
          <button
            type="button"
            onClick={() => toggleItem(index)}
            className="w-full text-left px-6 py-5 flex items-start justify-between gap-4"
            aria-expanded={openIndex === index}
          >
            <h4 className="font-semibold text-lg pr-8 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {item.question}
            </h4>
            <motion.div
              animate={{ rotate: openIndex === index ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="shrink-0 my-auto"
            >
              <ChevronDown className="size-6 group-hover:text-brand-600 transition-colors" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 pt-0">
                  <div className="h-px bg-linear-to-r from-neutral-500/0 via-neutral-400/50 to-neutral-500/0 mb-4" />
                  <p className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
