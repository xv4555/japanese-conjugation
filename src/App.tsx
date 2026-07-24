import { useState } from 'react';
import type { VerbClass } from './lib/conjugation';
import { FORM_CATEGORIES } from './lib/conjugation';
import type { Question } from './lib/quiz';
import { pickQuestion } from './lib/quiz';
import { Quiz } from './components/Quiz';
import { Settings } from './components/Settings';

const ALL_CLASSES: VerbClass[] = ['godan', 'ichidan', 'irregular'];

export default function App() {
  const [classes, setClasses] = useState<Set<VerbClass>>(new Set(ALL_CLASSES));
  const [categories, setCategories] = useState<Set<string>>(new Set(FORM_CATEGORIES));
  const [verbLimit, setVerbLimit] = useState<number | null>(null);
  const [hideKana, setHideKana] = useState(false);
  const [question, setQuestion] = useState<Question | null>(() =>
    pickQuestion(new Set(ALL_CLASSES), new Set(FORM_CATEGORIES), null)
  );
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const regenerate = (nextClasses: Set<VerbClass>, nextCategories: Set<string>, nextVerbLimit: number | null) => {
    setQuestion(pickQuestion(nextClasses, nextCategories, nextVerbLimit, question));
  };

  const toggleClass = (c: VerbClass) => {
    const next = new Set(classes);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setClasses(next);
    regenerate(next, categories, verbLimit);
  };

  const toggleCategory = (c: string) => {
    const next = new Set(categories);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setCategories(next);
    regenerate(classes, next, verbLimit);
  };

  const selectAllCategories = () => {
    const next = new Set(FORM_CATEGORIES);
    setCategories(next);
    regenerate(classes, next, verbLimit);
  };

  const clearCategories = () => {
    const next = new Set<string>();
    setCategories(next);
    regenerate(classes, next, verbLimit);
  };

  const changeVerbLimit = (limit: number | null) => {
    setVerbLimit(limit);
    regenerate(classes, categories, limit);
  };

  const handleResult = (correct: boolean) => {
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setStreak((s) => (correct ? s + 1 : 0));
  };

  const handleNext = () => {
    setQuestion(pickQuestion(classes, categories, verbLimit, question));
  };

  const accuracy = score.total === 0 ? 0 : Math.round((score.correct / score.total) * 100);

  return (
    <div className="app">
      <header className="app-header">
        <h1>語 Katsuyou</h1>
        <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Open settings">
          ⚙
        </button>
      </header>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{score.correct}</span>
          <span className="stat-label">correct</span>
        </div>
        <div className="stat">
          <span className="stat-value">{score.total}</span>
          <span className="stat-label">total</span>
        </div>
        <div className="stat">
          <span className="stat-value">{accuracy}%</span>
          <span className="stat-label">accuracy</span>
        </div>
        <div className="stat">
          <span className="stat-value">{streak}</span>
          <span className="stat-label">streak</span>
        </div>
      </div>

      <main>
        <Quiz question={question} hideKana={hideKana} onResult={handleResult} onNext={handleNext} />
      </main>

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        classes={classes}
        categories={categories}
        verbLimit={verbLimit}
        hideKana={hideKana}
        onToggleClass={toggleClass}
        onToggleCategory={toggleCategory}
        onSelectAllCategories={selectAllCategories}
        onClearCategories={clearCategories}
        onChangeVerbLimit={changeVerbLimit}
        onToggleHideKana={() => setHideKana((v) => !v)}
      />
    </div>
  );
}
