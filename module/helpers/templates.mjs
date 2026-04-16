/**
 * Préchargement des templates Handlebars
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return foundry.applications.handlebars.loadTemplates([
    // Partiels de la fiche personnage
    'systems/neon-city-overdrive/templates/actor/parts/actor-effects.hbs',
    // Fiche items
    'systems/neon-city-overdrive/templates/item/item-trademark-sheet.hbs',
    'systems/neon-city-overdrive/templates/item/parts/item-effects.hbs',
    // Dialog et chat
    'systems/neon-city-overdrive/templates/dialog/roll-dialog.hbs',
    'systems/neon-city-overdrive/templates/dialog/xp-dialog.hbs',
    'systems/neon-city-overdrive/templates/chat/roll-result.hbs',
  ]);
};
