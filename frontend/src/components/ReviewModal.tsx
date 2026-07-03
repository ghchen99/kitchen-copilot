import { useMemo, useState } from "react";
import {
  CLASSIFICATIONS,
  CLASS_COLORS,
  type Classification,
  type FridgeItem,
  type Inventory,
} from "../types";

interface Props {
  imageUrl: string;
  inventory: Inventory;
  busy: boolean;
  onSubmit: (inventory: Inventory) => void;
  onSkip: () => void;
}

// Small deterministic jitter so labels sit "loosely dotted" around each region
// instead of perfectly on the box corner.
function jitter(seed: number, range = 4): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return ((x - Math.floor(x)) - 0.5) * 2 * range;
}

export default function ReviewModal({
  imageUrl,
  inventory,
  busy,
  onSubmit,
  onSkip,
}: Props) {
  const [items, setItems] = useState<FridgeItem[]>(() =>
    inventory.items.map((i) => ({ ...i }))
  );
  const [selected, setSelected] = useState<number | null>(null);

  const boxed = useMemo(
    () => items.map((item, index) => ({ item, index })).filter((e) => e.item.bbox),
    [items]
  );

  function update(index: number, patch: Partial<FridgeItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it))
    );
  }

  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSelected(null);
  }

  function add() {
    setItems((prev) => [
      ...prev,
      { name: "", classification: "other", confidence: 1, bbox: null },
    ]);
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h2>Review ingredients</h2>
          <p>Tap a label on the photo or edit the list, then continue.</p>
        </div>

        <div className="modal-body">
          <div className="image-pane">
            <div className="image-frame">
              <img src={imageUrl} alt="Fridge" />
              {boxed.map(({ item, index }) => {
                const b = item.bbox!;
                const color = CLASS_COLORS[item.classification];
                const active = selected === index;
                return (
                  <div
                    key={index}
                    className={`bbox ${active ? "active" : ""}`}
                    style={{
                      left: `${b.x_min * 100}%`,
                      top: `${b.y_min * 100}%`,
                      width: `${(b.x_max - b.x_min) * 100}%`,
                      height: `${(b.y_max - b.y_min) * 100}%`,
                      borderColor: color,
                    }}
                  >
                    <input
                      className="bbox-label"
                      style={{
                        background: color,
                        transform: `translate(${jitter(index)}px, ${jitter(
                          index + 7
                        )}px)`,
                      }}
                      value={item.name}
                      placeholder="name"
                      size={Math.max(4, (item.name || "name").length)}
                      onChange={(e) => update(index, { name: e.target.value })}
                      onFocus={() => setSelected(index)}
                      onMouseEnter={() => setSelected(index)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="list-pane">
            {items.map((item, index) => (
              <div
                key={index}
                className={`ing-row ${selected === index ? "selected" : ""}`}
                onMouseEnter={() => item.bbox && setSelected(index)}
              >
                <span
                  className="swatch"
                  style={{ background: CLASS_COLORS[item.classification] }}
                />
                <input
                  className="ing-name"
                  value={item.name}
                  placeholder="ingredient"
                  onChange={(e) => update(index, { name: e.target.value })}
                  onFocus={() => setSelected(index)}
                />
                <select
                  className="ing-class"
                  value={item.classification}
                  onChange={(e) =>
                    update(index, {
                      classification: e.target.value as Classification,
                    })
                  }
                >
                  {CLASSIFICATIONS.map((c) => (
                    <option key={c} value={c}>
                      {c.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <button className="row-del" title="Remove" onClick={() => remove(index)}>
                  ✕
                </button>
              </div>
            ))}
            <button className="add-row" onClick={add}>
              + Add ingredient
            </button>
          </div>
        </div>

        <div className="modal-foot">
          <button className="ghost" disabled={busy} onClick={onSkip}>
            Skip edits
          </button>
          <button
            className="primary"
            disabled={busy}
            onClick={() =>
              onSubmit({ items: items.filter((i) => i.name.trim()) })
            }
          >
            Save &amp; continue
          </button>
        </div>
      </div>
    </div>
  );
}
