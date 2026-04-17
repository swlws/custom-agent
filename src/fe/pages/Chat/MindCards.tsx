import { useEffect, useState } from "react";
import { getUid } from "@/fe/lib/uid";

interface MindCard {
  title: string;
  desc: string;
  prompt: string;
}

interface MindCardsProps {
  onSelect: (prompt: string) => void;
}

export function MindCards({ onSelect }: MindCardsProps) {
  const [cards, setCards] = useState<MindCard[]>([]);

  useEffect(() => {
    fetch(`/api/mindcards?uid=${encodeURIComponent(getUid())}`)
      .then((r) => r.json())
      .then((data: MindCard[]) => setCards(data));
  }, []);

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, i) => (
        <button
          key={i}
          onClick={() => onSelect(card.prompt)}
          className="rounded-xl border border-gray-200 p-4 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-[#3f3f46] dark:hover:border-[#52525b] dark:hover:bg-[#2f2f2f]"
        >
          <p className="mb-1 text-sm font-medium text-gray-800 dark:text-gray-100">{card.title}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{card.desc}</p>
        </button>
      ))}
    </div>
  );
}
