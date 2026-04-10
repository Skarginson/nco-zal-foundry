export const NCO = {};

// Les 4 traits principaux NCO
NCO.traits = {
  body:     'NCO.Trait.Body',
  reflex:   'NCO.Trait.Reflex',
  mind:     'NCO.Trait.Mind',
  presence: 'NCO.Trait.Presence',
};

// Labels équivalents en mode Zalozhniy
NCO.traitsZalozhniy = {
  body:     'NCO.Trait.Physique',
  reflex:   'NCO.Trait.Terrain',
  mind:     'NCO.Trait.Analyse',
  presence: 'NCO.Trait.Couverture',
};

// Types d'items
NCO.itemTypes = {
  gear:    'NCO.Item.Gear',
  move:    'NCO.Item.Move',
  contact: 'NCO.Item.Contact',
  tag:     'NCO.Item.Tag',
};

// Types de tags
NCO.tagTypes = {
  positive: 'NCO.Tag.Positive',
  negative: 'NCO.Tag.Negative',
  neutral:  'NCO.Tag.Neutral',
};

// Types d'assets (Zalozhniy)
NCO.assetTypes = {
  human:       'NCO.Asset.Type.Human',
  technical:   'NCO.Asset.Type.Technical',
  financial:   'NCO.Asset.Type.Financial',
  information: 'NCO.Asset.Type.Information',
};
