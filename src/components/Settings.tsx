import type { VerbClass } from '../lib/conjugation';
import { FORM_CATEGORIES } from '../lib/conjugation';

const CLASS_LABELS: Record<VerbClass, string> = {
  godan: 'Godan (u-verbs)',
  ichidan: 'Ichidan (ru-verbs)',
  irregular: 'Irregular (する / 来る)',
};

interface Props {
  classes: Set<VerbClass>;
  categories: Set<string>;
  onToggleClass: (c: VerbClass) => void;
  onToggleCategory: (c: string) => void;
  onSelectAllCategories: () => void;
  onClearCategories: () => void;
  open: boolean;
  onClose: () => void;
}

export function Settings({
  classes,
  categories,
  onToggleClass,
  onToggleCategory,
  onSelectAllCategories,
  onClearCategories,
  open,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <section>
          <h3>Verb groups</h3>
          <div className="checkbox-grid">
            {(Object.keys(CLASS_LABELS) as VerbClass[]).map((c) => (
              <label key={c} className="checkbox-row">
                <input type="checkbox" checked={classes.has(c)} onChange={() => onToggleClass(c)} />
                {CLASS_LABELS[c]}
              </label>
            ))}
          </div>
        </section>

        <section>
          <div className="section-header-row">
            <h3>Conjugation forms</h3>
            <div className="link-buttons">
              <button className="link-btn" onClick={onSelectAllCategories}>
                All
              </button>
              <button className="link-btn" onClick={onClearCategories}>
                None
              </button>
            </div>
          </div>
          <div className="checkbox-grid">
            {FORM_CATEGORIES.map((cat) => (
              <label key={cat} className="checkbox-row">
                <input type="checkbox" checked={categories.has(cat)} onChange={() => onToggleCategory(cat)} />
                {cat}
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
