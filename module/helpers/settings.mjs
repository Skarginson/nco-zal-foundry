/**
 * Enregistrement des settings du système NCO/Zalozhniy
 */
export function registerSettings() {
  // Mode de jeu : NCO standard ou Zalozhniy Quartet
  game.settings.register('neon-city-overdrive', 'gameMode', {
    name: 'NCO.Settings.GameMode.Name',
    hint: 'NCO.Settings.GameMode.Hint',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      nco_standard: 'NCO.Settings.GameMode.Standard',
      zalozhniy:    'NCO.Settings.GameMode.Zalozhniy',
    },
    default: 'nco_standard',
    onChange: () => {
      // Rafraîchit toutes les fiches ouvertes quand le mode change
      Object.values(ui.windows)
        .filter((w) => w instanceof ActorSheet || w instanceof ItemSheet)
        .forEach((w) => w.render(false));
    },
  });

  // Sanité active (Zalozhniy)
  game.settings.register('neon-city-overdrive', 'sanityEnabled', {
    name: 'NCO.Settings.Sanity.Name',
    hint: 'NCO.Settings.Sanity.Hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: () => {
      Object.values(ui.windows)
        .filter((w) => w instanceof ActorSheet)
        .forEach((w) => w.render(false));
    },
  });
}
