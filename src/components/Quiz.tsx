import { useEffect, useRef, useState } from 'react';
import * as wanakana from 'wanakana';
import type { Question } from '../lib/quiz';
import { conjugate, FORMS } from '../lib/conjugation';

interface Props {
  question: Question | null;
  hideKana: boolean;
  onResult: (correct: boolean) => void;
  onNext: () => void;
}

type Status = 'idle' | 'correct' | 'incorrect';

export function Quiz({ question, hideKana, onResult, onNext }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');

  // wanakana.bind() manipulates the input's DOM value directly as the user
  // types romaji. Keeping the input uncontrolled (no React `value` prop)
  // avoids React's re-render fighting with wanakana's own DOM writes, which
  // otherwise corrupts in-flight IME conversions.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    wanakana.bind(el, { IMEMode: true });
    return () => wanakana.unbind(el);
  }, []);

  useEffect(() => {
    if (inputRef.current) inputRef.current.value = '';
    setStatus('idle');
  }, [question]);

  // Focus only once the input has actually re-rendered as enabled — right
  // after setStatus('idle') above, the input is still disabled from the
  // previous render, so focusing there would silently no-op.
  useEffect(() => {
    if (status === 'idle') inputRef.current?.focus();
  }, [status]);

  const formMeta = question ? FORMS.find((f) => f.id === question.formId)! : null;
  const answer = question ? conjugate(question.verb, question.formId) : null;

  const check = () => {
    if (!question || !answer) return;
    if (status !== 'idle') {
      onNext();
      return;
    }
    const raw = inputRef.current?.value ?? '';
    const normalized = wanakana.toHiragana(raw.trim(), { IMEMode: true });
    const isCorrect = normalized === answer.kana;
    setStatus(isCorrect ? 'correct' : 'incorrect');
    onResult(isCorrect);
  };

  // Once an answer is checked, the input becomes disabled and loses focus,
  // so the Enter key needs a window-level listener (not an input handler)
  // to advance to the next question.
  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        check();
      }
    };
    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  });

  if (!question || !formMeta || !answer) {
    return (
      <div className="card empty-state">
        <p>No verbs or forms are selected. Open settings and pick at least one of each.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="form-label">{formMeta.label}</div>
      <div className="prompt">
        <span className="prompt-kanji">{question.verb.kanji}</span>
        {!hideKana && <span className="prompt-kana">（{question.verb.kana}）</span>}
      </div>
      <div className="prompt-meaning">{question.verb.meaning}</div>

      <input
        ref={inputRef}
        className={`answer-input status-${status}`}
        type="text"
        defaultValue=""
        placeholder="type romaji…"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={status !== 'idle'}
      />

      {status !== 'idle' && (
        <div className={`feedback feedback-${status}`}>
          {status === 'correct' ? 'Correct!' : 'Not quite.'}
          <span className="feedback-answer">
            {answer.kanji} （{answer.kana}）
          </span>
        </div>
      )}

      <div className="actions">
        <button className="primary-btn" onClick={check}>
          {status === 'idle' ? 'Check' : 'Next'}
        </button>
      </div>
    </div>
  );
}
