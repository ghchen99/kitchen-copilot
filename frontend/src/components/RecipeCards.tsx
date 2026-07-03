import type { MealPlan } from "../types";

export default function RecipeCards({ plan }: { plan: MealPlan }) {
  return (
    <div className="recipe-list">
      {plan.recipes.map((r, i) => (
        <article className="recipe-card" key={i}>
          <header>
            <h3>{r.name}</h3>
            <span className="meta">
              ⏱ {r.time_minutes} min · {r.difficulty}
            </span>
          </header>
          <p className="intro">{r.intro}</p>

          {r.dietary_tags.length > 0 && (
            <div className="tags">
              {r.dietary_tags.map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
          )}

          <p className="ing-line">
            <strong>Ingredients:</strong>{" "}
            {r.ingredients
              .map((i) => (i.amount ? `${i.amount} ${i.name}` : i.name))
              .join(", ")}
          </p>

          {r.missing_ingredients.length > 0 && (
            <p className="missing">
              <strong>Missing:</strong> {r.missing_ingredients.join(", ")}
            </p>
          )}

          <ol className="steps">
            {r.steps.map((s, si) => (
              <li key={si}>{s}</li>
            ))}
          </ol>

          {r.nutrition && (
            <p className="nutrition">
              {r.nutrition.calories != null && <span>{r.nutrition.calories} kcal</span>}
              {r.nutrition.protein_g != null && <span>{r.nutrition.protein_g}g protein</span>}
              {r.nutrition.carbs_g != null && <span>{r.nutrition.carbs_g}g carbs</span>}
              {r.nutrition.fat_g != null && <span>{r.nutrition.fat_g}g fat</span>}
            </p>
          )}
        </article>
      ))}

      {plan.quick_snack_ideas.length > 0 && (
        <p className="extra">
          <strong>🍿 Snack ideas:</strong> {plan.quick_snack_ideas.join(", ")}
        </p>
      )}
      {plan.missing_common_items.length > 0 && (
        <p className="extra muted">
          <strong>🛒 Consider buying:</strong> {plan.missing_common_items.join(", ")}
        </p>
      )}
    </div>
  );
}
