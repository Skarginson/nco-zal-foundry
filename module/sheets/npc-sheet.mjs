import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Feuille de PNJ (menace) pour Neon City Overdrive.
 */
export class NCONPCSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ['nco', 'sheet', 'actor', 'npc'],
    position: { width: 480, height: 520 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      editImage: NCONPCSheet._onEditImage,
      changeTab: NCONPCSheet._onChangeTab,
      // Effets actifs
      create: NCONPCSheet._onEffectAction,
      edit:   NCONPCSheet._onEffectAction,
      delete: NCONPCSheet._onEffectAction,
      toggle: NCONPCSheet._onEffectAction,
    },
  };

  static PARTS = {
    main: {
      template: 'systems/neon-city-overdrive/templates/actor/actor-npc-sheet.hbs',
    },
  };

  _activeTab = 'stats';

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actorData = this.document.toObject(false);

    context.actor  ??= this.actor;
    context.system   = actorData.system;
    context.flags    = actorData.flags;
    context.config   = CONFIG.NCO;
    context.cssClass = this.isEditable ? 'editable' : 'locked';

    context.enrichedNotes = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.actor.system.notes,
      {
        secrets:    this.document.isOwner,
        async:      true,
        rollData:   this.actor.getRollData(),
        relativeTo: this.actor,
      }
    );

    context.effects = prepareActiveEffectCategories(
      this.actor.allApplicableEffects()
    );

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this._syncTabs();
  }

  _syncTabs() {
    const tab = this._activeTab ?? 'stats';
    this.element.querySelectorAll('.sheet-tabs .item[data-tab]').forEach((n) =>
      n.classList.toggle('active', n.dataset.tab === tab));
    this.element.querySelectorAll('.sheet-body .tab[data-tab]').forEach((t) =>
      t.classList.toggle('active', t.dataset.tab === tab));
  }

  /* -------------------------------------------- */
  /* Action Handlers                               */
  /* -------------------------------------------- */

  static async _onEditImage(event, target) {
    const attr    = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document._source, attr);
    new FilePicker({
      type:     'image',
      current:  current,
      callback: (src) => this.document.update({ [attr]: src }),
    }).browse();
  }

  static _onChangeTab(event, target) {
    this._activeTab = target.dataset.tab;
    this._syncTabs();
  }

  static _onEffectAction(event, target) {
    if (!target.classList.contains('effect-control')) return;
    const li       = target.closest('li');
    const parentId = li?.dataset.parentId;
    const owner    = parentId === this.actor.id
      ? this.actor
      : this.actor.items.get(parentId);
    if (!owner) return;
    onManageActiveEffect(
      { preventDefault: () => event.preventDefault(), currentTarget: target },
      owner
    );
  }
}
