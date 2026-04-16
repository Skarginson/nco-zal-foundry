import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { NCORollDialog } from '../apps/roll-dialog.mjs';
import { NCOXPDialog }   from '../apps/xp-dialog.mjs';

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Feuille de personnage (character) pour Neon City Overdrive.
 */
export class NCOActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ['nco', 'sheet', 'actor', 'character'],
    position: { width: 520, height: 620 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      editImage:       NCOActorSheet._onEditImage,
      changeTab:       NCOActorSheet._onChangeTab,
      openRoll:        NCOActorSheet._onOpenRoll,
      itemCreate:      NCOActorSheet._onItemCreate,
      itemEdit:        NCOActorSheet._onItemEdit,
      itemDelete:      NCOActorSheet._onItemDelete,
      tmDelete:        NCOActorSheet._onTmDelete,
      toggleTrademark: NCOActorSheet._onToggleTrademark,
      toggleEdge:      NCOActorSheet._onToggleEdge,
      toggleGearTag:   NCOActorSheet._onToggleGearTag,
      pipClick:        NCOActorSheet._onPipClick,
      driveBoxClick:   NCOActorSheet._onDriveBoxClick,
      spendXP:         NCOActorSheet._onSpendXP,
      // Effets actifs (data-action dans le partial effects)
      create: NCOActorSheet._onEffectAction,
      edit:   NCOActorSheet._onEffectAction,
      delete: NCOActorSheet._onEffectAction,
      toggle: NCOActorSheet._onEffectAction,
    },
  };

  static PARTS = {
    main: {
      template: 'systems/neon-city-overdrive/templates/actor/actor-character-sheet.hbs',
    },
  };

  /** Onglet actif courant */
  _activeTab = 'trademarks';

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actorData = this.document.toObject(false);
    const sys = actorData.system;

    context.actor  ??= this.actor;
    context.system   = sys;
    context.flags    = actorData.flags;
    context.config   = CONFIG.NCO;
    context.cssClass = this.isEditable ? 'editable' : 'locked';

    // Jauges
    const hitsVal  = sys.hits?.value         ?? 0;
    const hitsMax  = sys.hits?.max           ?? 3;
    const stashVal = sys.stash?.value        ?? 0;
    const xpVal    = sys.xp?.value           ?? 0;
    const stuntVal = sys.stunt_points?.value ?? 0;
    const stuntMax = sys.stunt_points?.max   ?? 3;

    context.hitsMax  = hitsMax;
    context.stuntMax = stuntMax;

    context.hitBoxes   = Array.from({ length: hitsMax }, (_, i) => ({ filled: i < hitsVal,  index: i }));
    context.stashBoxes = Array.from({ length: 5 },       (_, i) => ({ filled: i < stashVal, index: i }));
    context.stuntBoxes = Array.from({ length: stuntMax }, (_, i) => ({ filled: i < stuntVal, index: i }));

    // Drive track : états par case (0=vide, 1=tick, 2=croix)
    const rawDriveBoxes = sys.drive_track?.boxes;
    if (Array.isArray(rawDriveBoxes) && rawDriveBoxes.length === 9) {
      context.driveBoxes = rawDriveBoxes.map((state, i) => ({
        index:   i,
        isTick:  state === 1,
        isCross: state === 2,
      }));
    } else {
      // Migration depuis l'ancien format { value: N }
      const legacyVal = sys.drive_track?.value ?? 0;
      context.driveBoxes = Array.from({ length: 9 }, (_, i) => ({
        index:   i,
        isTick:  false,
        isCross: i < legacyVal,
      }));
    }

    // XP : 3 groupes de 5
    context.xpGroups = [0, 1, 2].map((g) =>
      Array.from({ length: 5 }, (_, i) => {
        const idx = g * 5 + i;
        return { filled: idx < xpVal, index: idx };
      })
    );

    this._prepareItems(context);

    context.effects = prepareActiveEffectCategories(
      this.actor.allApplicableEffects()
    );

    return context;
  }

  /**
   * Trie et classe les items par type.
   */
  _prepareItems(context) {
    const gear       = [];
    const trademarks = [];

    for (const item of this.actor.items) {
      const i = item.toObject(false);
      i.img = i.img || Item.DEFAULT_ICON;
      switch (i.type) {
        case 'gear':
          if (i.system.gear_type === 'special') {
            i.tagsArray = [1, 2, 3, 4, 5]
              .map((n) => ({
                field:  `tag${n}`,
                value:  i.system[`tag${n}`],
                active: i.system[`tag${n}_active`],
              }))
              .filter((t) => t.value?.trim());
          }
          gear.push(i);
          break;
        case 'trademark':
          i.edgesArray = [1, 2, 3, 4, 5]
            .map((n) => ({
              field:  `edge${n}`,
              value:  i.system[`edge${n}`],
              active: i.system[`edge${n}_active`],
              usable: i.system.active,
            }))
            .filter((e) => e.value?.trim());
          trademarks.push(i);
          break;
      }
    }

    context.gear              = gear;
    context.trademarks        = trademarks;
    context.trademarkCount    = trademarks.length;
    context.trademarkMaxReached = trademarks.length >= 5;
  }

  /* -------------------------------------------- */

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this._syncTabs();
  }

  /** Synchronise la visibilité des onglets avec `_activeTab`. */
  _syncTabs() {
    const tab = this._activeTab ?? 'trademarks';
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

  static _onOpenRoll(event, target) {
    let bonusDA = 0;
    for (const item of this.actor.items) {
      if (item.type === 'trademark') {
        if (!item.system.active) continue;
        bonusDA++;
        for (let n = 1; n <= 5; n++) {
          if (item.system[`edge${n}`]?.trim() && item.system[`edge${n}_active`]) bonusDA++;
        }
      } else if (item.type === 'gear' && item.system.gear_type === 'special') {
        for (let n = 1; n <= 5; n++) {
          if (item.system[`tag${n}`]?.trim() && item.system[`tag${n}_active`]) bonusDA++;
        }
      }
    }

    // Chaque case de trauma non vide ajoute 1 DD
    let traumaDD = 0;
    for (let n = 1; n <= 8; n++) {
      if (this.actor.system[`trauma${n}`]?.trim()) traumaDD++;
    }

    NCORollDialog.show(this.actor, { bonusDA, traumaDD });
  }

  static _onItemCreate(event, target) {
    const type = target.dataset.type;
    return Item.create({ name: `Nouveau ${type}`, type }, { parent: this.actor });
  }

  static _onItemEdit(event, target) {
    const item = this.actor.items.get(target.closest('[data-item-id]')?.dataset.itemId);
    if (item) item.sheet.render(true);
  }

  static async _onItemDelete(event, target) {
    const item = this.actor.items.get(target.closest('[data-item-id]')?.dataset.itemId);
    if (item) await item.delete();
  }

  static async _onTmDelete(event, target) {
    const item = this.actor.items.get(target.closest('.trademark-block')?.dataset.itemId);
    if (item) await item.delete();
  }

  static async _onToggleTrademark(event, target) {
    const item = this.actor.items.get(target.closest('.trademark-block')?.dataset.itemId);
    if (!item) return;
    const newActive = !item.system.active;
    const update = { 'system.active': newActive };
    if (!newActive) {
      for (let n = 1; n <= 5; n++) update[`system.edge${n}_active`] = false;
    }
    await item.update(update);
  }

  static async _onToggleEdge(event, target) {
    event.stopPropagation();
    const item = this.actor.items.get(target.closest('.trademark-block')?.dataset.itemId);
    if (!item || !item.system.active) return;
    await item.update({ [`system.${target.dataset.field}_active`]: !item.system[`${target.dataset.field}_active`] });
  }

  static async _onToggleGearTag(event, target) {
    event.stopPropagation();
    const item = this.actor.items.get(target.closest('.gear-item')?.dataset.itemId);
    if (!item) return;
    await item.update({ [`system.${target.dataset.field}_active`]: !item.system[`${target.dataset.field}_active`] });
  }

  static async _onPipClick(event, target) {
    event.preventDefault();
    const field  = target.dataset.field;
    const maxVal = parseInt(target.dataset.max);
    const index  = parseInt(target.dataset.index);
    const current = foundry.utils.getProperty(this.actor.system, field.replace('system.', '')) ?? 0;
    const newValue = index < current ? index : index + 1;
    await this.actor.update({ [field]: Math.max(0, Math.min(maxVal, newValue)) });
  }

  /**
   * Cycle l'état d'une case de la piste Drive : vide (0) → tick (1) → croix (2) → vide.
   */
  static async _onDriveBoxClick(event, target) {
    const index = parseInt(target.dataset.index);
    const rawBoxes = this.actor.system.drive_track?.boxes;
    let boxes;
    if (Array.isArray(rawBoxes) && rawBoxes.length === 9) {
      boxes = [...rawBoxes];
    } else {
      const legacyVal = this.actor.system.drive_track?.value ?? 0;
      boxes = Array.from({ length: 9 }, (_, i) => (i < legacyVal ? 2 : 0));
    }
    boxes[index] = (boxes[index] + 1) % 3;
    await this.actor.update({ 'system.drive_track.boxes': boxes });
  }

  /**
   * Ouvre le dialog de dépense de 5 XP et applique l'avancée choisie.
   */
  static async _onSpendXP(event, target) {
    const actor    = this.actor;
    const xp       = actor.system.xp?.value           ?? 0;
    const hitsMax  = actor.system.hits?.max            ?? 3;
    const stuntMax = actor.system.stunt_points?.max    ?? 3;
    const trademarks = actor.items.filter(i => i.type === 'trademark');

    if (xp < 5) {
      ui.notifications.warn(game.i18n.localize('NCO.XP.NotEnough'));
      return;
    }

    const eligibleTm = trademarks.filter(tm =>
      [1, 2, 3, 4, 5].some(n => !tm.system[`edge${n}`]?.trim())
    );

    const canTm    = trademarks.length < 5;
    const canEdge  = eligibleTm.length > 0;
    const canHits  = hitsMax < 4;
    const canStunt = stuntMax < 5;

    if (!canTm && !canEdge && !canHits && !canStunt) {
      ui.notifications.info(game.i18n.localize('NCO.XP.NothingAvailable'));
      return;
    }

    const result = await NCOXPDialog.show(actor);
    if (!result?.advancement) return;

    const i18n = key => game.i18n.localize(key);

    const { advancement, trademark_id } = result;

    switch (advancement) {
      case 'trademark': {
        const item = await Item.create(
          { name: i18n('NCO.XP.NewTrademarkName'), type: 'trademark' },
          { parent: actor }
        );
        item?.sheet?.render(true);
        break;
      }
      case 'edge': {
        const tm   = actor.items.get(trademark_id);
        if (!tm) return;
        const slot = [1, 2, 3, 4, 5].find(n => !tm.system[`edge${n}`]?.trim());
        if (slot === undefined) return;
        await tm.update({ [`system.edge${slot}`]: i18n('NCO.XP.NewEdgeName') });
        tm.sheet?.render(true);
        break;
      }
      case 'hits':
        await actor.update({ 'system.hits.max': hitsMax + 1 });
        break;
      case 'stunt':
        await actor.update({ 'system.stunt_points.max': stuntMax + 1 });
        break;
      default:
        return;
    }

    await actor.update({ 'system.xp.value': xp - 5 });
  }

  /** Gère les actions create/edit/delete/toggle des effets actifs. */
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
