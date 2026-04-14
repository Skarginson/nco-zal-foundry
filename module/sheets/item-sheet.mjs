import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * Feuille générique pour tous les types d'items NCO.
 * Le template est résolu dynamiquement via _renderHTML selon le type de l'item.
 */
export class NCOItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ['nco', 'sheet', 'item'],
    position: { width: 480, height: 400 },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      create: NCOItemSheet._onEffectAction,
      edit:   NCOItemSheet._onEffectAction,
      delete: NCOItemSheet._onEffectAction,
      toggle: NCOItemSheet._onEffectAction,
    },
  };

  static PARTS = { main: {} };

  static #KNOWN_TYPES = ['gear', 'move', 'contact', 'tag', 'trademark'];

  get #template() {
    const type = NCOItemSheet.#KNOWN_TYPES.includes(this.item.type)
      ? this.item.type
      : 'gear';
    return `systems/neon-city-overdrive/templates/item/item-${type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override — précharge le bon template avant le rendu */
  async _preRender(context, options) {
    await foundry.applications.handlebars.loadTemplates([this.#template]);
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

    context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.item.system.description ?? '',
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

  /** @override — rend le template dynamique et retourne {main: HTMLElement} */
  async _renderHTML(context, options) {
    const html = await foundry.applications.handlebars.renderTemplate(this.#template, context);
    const div  = document.createElement('div');
    div.innerHTML = html;
    const el = div.firstElementChild;
    el.setAttribute('data-application-part', 'main');
    return { main: el };
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
