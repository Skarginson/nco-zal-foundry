// Imports des classes de documents
import { NCOActor } from './documents/actor.mjs';
import { NCOItem } from './documents/item.mjs';
// Imports des feuilles de personnage
import { NCOActorSheet } from './sheets/actor-sheet.mjs';
import { NCONPCSheet } from './sheets/npc-sheet.mjs';
import { NCOItemSheet } from './sheets/item-sheet.mjs';
// Helpers
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { NCO } from './helpers/config.mjs';
import { registerSettings } from './helpers/settings.mjs';
// Applications
import { NCORollDialog } from './apps/roll-dialog.mjs';

/* -------------------------------------------- */
/*  Hook Init                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Exposition des classes sur l'objet global pour accès contextuel
  game.nco = {
    NCOActor,
    NCOItem,
    NCORollDialog,
  };

  // Constantes de configuration
  CONFIG.NCO = NCO;

  // Initiative basique (pas de modificateurs complexes dans NCO)
  CONFIG.Combat.initiative = {
    formula: '1d6',
    decimals: 0,
  };

  // Enregistrement des settings système
  registerSettings();

  // Définition des classes de documents custom
  CONFIG.Actor.documentClass = NCOActor;
  CONFIG.Item.documentClass = NCOItem;

  // Les effets actifs ne se transfèrent pas automatiquement à l'acteur
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Enregistrement des feuilles
  const ActorSheets = foundry.documents.collections.Actors;
  const ItemSheets  = foundry.documents.collections.Items;
  ActorSheets.unregisterSheet('core', foundry.appv1.sheets.ActorSheet);
  ActorSheets.registerSheet('neon-city-overdrive', NCOActorSheet, {
    types: ['character'],
    makeDefault: true,
    label: 'NCO.SheetLabels.Character',
  });
  ActorSheets.registerSheet('neon-city-overdrive', NCONPCSheet, {
    types: ['npc'],
    makeDefault: true,
    label: 'NCO.SheetLabels.NPC',
  });
  ItemSheets.unregisterSheet('core', foundry.appv1.sheets.ItemSheet);
  ItemSheets.registerSheet('neon-city-overdrive', NCOItemSheet, {
    makeDefault: true,
    label: 'NCO.SheetLabels.Item',
  });

  // Préchargement des templates Handlebars
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Helpers Handlebars                          */
/* -------------------------------------------- */

// Génère un tableau de N entiers à partir de 0 (utile pour les jauges visuelles)
Handlebars.registerHelper('times', function (n, block) {
  let result = '';
  for (let i = 0; i < n; i++) result += block.fn(i);
  return result;
});

// Retourne true si a <= b
Handlebars.registerHelper('lte', function (a, b) {
  return a <= b;
});

// Soustraction simple pour les templates
Handlebars.registerHelper('subtract', function (a, b) {
  return a - b;
});

// Concaténation de chaînes
Handlebars.registerHelper('concat', function (...args) {
  return args.slice(0, -1).join('');
});

// Égalité stricte
Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

/* -------------------------------------------- */
/*  Hook Ready                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Macros Hotbar                               */
/* -------------------------------------------- */

async function createItemMacro(data, slot) {
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'Vous ne pouvez créer des macros que pour des items possédés.'
    );
  }
  const item = await Item.fromDropData(data);
  const command = `game.nco.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'neon-city-overdrive.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}
