import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * Feuille générique pour tous les types d'items NCO.
 * Le template est sélectionné dynamiquement selon le type de l'item.
 */
export class NCOItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ['nco', 'sheet', 'item'],
    position: { width: 480, height: 400 },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      // Effets actifs
      create: NCOItemSheet._onEffectAction,
      edit:   NCOItemSheet._onEffectAction,
      delete: NCOItemSheet._onEffectAction,
      toggle: NCOItemSheet._onEffectAction,
    },
  };

  // Part défini comme objet vide ; le template est résolu dans _renderHTML
  static PARTS = { main: {} };

  /* -------------------------------------------- */

  /** @override — sélectionne le template selon le type d'item. */
  async _renderHTML(context, options) {
    const template = `systems/neon-city-overdrive/templates/item/item-${this.item.type}-sheet.hbs`;
    return { main: await renderTemplate(template, context) };
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const itemData = this.document.toObject(false);

    context.item     ??= this.item;
    context.system     = itemData.system;
    context.flags      = itemData.flags;
    context.config     = CONFIG.NCO;
    context.cssClass   = this.isEditable ? 'editable' : 'locked';

    context.enrichedDescription = await TextEditor.enrichHTML(
      this.item.system.description,
      {
        secrets:    this.document.isOwner,
        async:      true,
        rollData:   this.item.getRollData(),
        relativeTo: this.item,
      }
    );

    context.effects = prepareActiveEffectCategories(this.item.effects);

    return context;
  }

  /* -------------------------------------------- */
  /* Action Handlers                               */
  /* -------------------------------------------- */

  static _onEffectAction(event, target) {
    if (!target.classList.contains('effect-control')) return;
    onManageActiveEffect(
      { preventDefault: () => event.preventDefault(), currentTarget: target },
      this.item
    );
  }
}
