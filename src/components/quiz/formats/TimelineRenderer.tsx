import { useEffect, useMemo, useState } from 'react';
import { Reorder } from 'framer-motion';
import type { TimelineQ } from '@/types/question';
import { checkTimelineOrder } from '@/game/questionFormats/timeline';
import { shuffle } from '@/utils/shuffle';
import { Button } from '@/components/ui/Button';
import type { AnswerEvent } from '../QuestionCard';

interface Props {
  question: TimelineQ;
  remainingMs: number;
  onAnswer: (event: AnswerEvent) => void;
  feedbackOpen: boolean;
}

export function TimelineRenderer({ question, remainingMs, onAnswer, feedbackOpen }: Props) {
  const labels = useMemo(() => question.items.map((i) => i.label), [question.id]);
  const [order, setOrder] = useState<string[]>(() => shuffle(labels));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setOrder(shuffle(labels));
    setSubmitted(false);
  }, [question.id, labels]);

  function handleSubmit() {
    if (submitted || feedbackOpen) return;
    setSubmitted(true);
    onAnswer({ correct: checkTimelineOrder(question, order), timeRemainingMs: remainingMs });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold leading-tight">{question.prompt}</h2>
      <p className="text-xs text-slate-400">Drag to reorder — earliest at top.</p>
      <Reorder.Group axis="y" values={order} onReorder={setOrder} className="space-y-2">
        {order.map((label) => (
          <Reorder.Item
            key={label}
            value={label}
            className="px-4 py-3 rounded-xl bg-stadium-800/70 border border-white/10 cursor-grab active:cursor-grabbing"
          >
            {label}
          </Reorder.Item>
        ))}
      </Reorder.Group>
      <Button onClick={handleSubmit} disabled={submitted}>
        Lock in order
      </Button>
    </div>
  );
}
