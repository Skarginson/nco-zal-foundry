/**
 * Préchargement des templates Handlebars
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Partiels de la fiche personnage
    'systems/neon-city-overdrive/templates/actor/parts/actor-traits.hbs',
    'systems/neon-city-overdrive/templates/actor/parts/actor-items.hbs',
    'systems/neon-city-overdrive/templates/actor/parts/actor-effects.hbs',
    'systems/neon-city-overdrive/templates/actor/parts/actor-mission.hbs',
    // Partiels item
    'systems/neon-city-overdrive/templates/item/parts/item-effects.hbs',
    // Dialog et chat
    'systems/neon-city-overdrive/templates/dialog/roll-dialog.hbs',
    'systems/neon-city-overdrive/templates/chat/roll-result.hbs',
  ]);
};
