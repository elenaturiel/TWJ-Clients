-- Añade dos comidas más al día: snack1 (media mañana) y snack2 (media tarde).
alter type meal_type add value if not exists 'snack1' before 'comida';
alter type meal_type add value if not exists 'snack2' before 'cena';
