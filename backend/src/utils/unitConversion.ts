export function convertToStockUnit(quantity: number, recipeUnit: string, stockUnit: string): number {
    if (recipeUnit === stockUnit) return quantity;
    if (recipeUnit === 'г' && stockUnit === 'кг') return quantity / 1000;
    if (recipeUnit === 'мл' && stockUnit === 'л') return quantity / 1000;
    if (recipeUnit === 'кг' && stockUnit === 'г') return quantity * 1000;
    if (recipeUnit === 'л' && stockUnit === 'мл') return quantity * 1000;
    throw new Error(`Incompatible units: ${recipeUnit} → ${stockUnit}`);
}

export const compatibleUnits: Record<string, string[]> = {
    'кг': ['кг', 'г'],
    'г':  ['г', 'кг'],
    'л':  ['л', 'мл'],
    'мл': ['мл', 'л'],
    'шт': ['шт'],
};
