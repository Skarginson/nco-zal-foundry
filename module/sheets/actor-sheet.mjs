import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { NCORollDialog } from '../apps/roll-dialog.mjs';

/**
 * Feuille de personnage (character) pour Neon City Overdrive.
 * @extends {ActorSheet}
 */
export class NCOActorSheet extends foundry.appv1.sheets.ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['nco', 'sheet', 'actor', 'character'],
      width: 520,
      height: 600,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'trademarks',
        },
      ],
    });
  }

  /** @override */
  get template() {
    return 'systems/neon-city-overdrive/templates/actor/actor-character-sheet.hbs';
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = super.getData();
    const actorData = this.document.toObject(false);
    const sys = actorData.system;

    context.system = sys;
    context.flags  = actorData.flags;
    context.config = CONFIG.NCO;

    // Jauges visualisées sous forme de cases cliquables
    const hitsVal       = sys.hits?.value         ?? 0;
    const stashVal      = sys.stash?.value        ?? 0;
    const driveTrackVal = sys.drive_track?.value  ?? 0;
    const xpVal         = sys.xp?.value           ?? 0;
    const stuntVal      = sys.stunt_points?.value ?? 0;

    context.hitBoxes   = Array.from({ length: 3 }, (_, i) => ({ filled: i < hitsVal,       index: i }));
    context.stashBoxes = Array.from({ length: 5 }, (_, i) => ({ filled: i < stashVal,      index: i }));
    context.driveBoxes = Array.from({ length: 9 }, (_, i) => ({ filled: i < driveTrackVal, index: i }));
    context.stuntBoxes = Array.from({ length: 3 }, (_, i) => ({ filled: i < stuntVal,      index: i }));

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
   * @param {object} context
   */
  _prepareItems(context) {
    const gear       = [];
    const trademarks = [];

    for (const item of context.items) {
      item.img = item.img || Item.DEFAULT_ICON;
      switch (item.type) {
        case 'gear':      gear.push(item);       break;
        case 'trademark':
          item.edgesArray = [1, 2, 3, 4, 5]
            .map((n) => ({
              field:  `edge${n}`,
              value:  item.system[`edge${n}`],
              active: item.system[`edge${n}_active`],
              usable: item.system.active,
            }))
            .filter((e) => e.value?.trim());
          trademarks.push(item);
          break;
      }
    }

    context.gear       = gear;
    context.trademarks = trademarks;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Ouvrir la fiche d'un item via le bouton edit
    html.on('click', '.item-edit, .tm-edit', (ev) => {
      const container = $(ev.currentTarget).closest('[data-item-id]');
      const item = this.actor.items.get(container.data('itemId'));
      if (item) item.sheet.render(true);
    });

    if (!this.isEditable) return;

    // Créer un item
    html.on('click', '.item-create, .tm-create', this._onItemCreate.bind(this));

    // Supprimer un item standard (gear)
    html.on('click', '.item-delete', (ev) => {
      const li   = $(ev.currentTarget).parents('[data-item-id]');
      const item = this.actor.items.get(li.data('itemId'));
      if (item) {
        item.delete();
        li.slideUp(200, () => this.render(false));
      }
    });

    // Supprimer un trademark via la croix dans le bloc
    html.on('click', '.tm-delete', (ev) => {
      const block  = $(ev.currentTarget).closest('.trademark-block');
      const itemId = block.data('itemId');
      const item   = this.actor.items.get(itemId);
      if (item) {
        item.delete();
        block.slideUp(200, () => this.render(false));
      }
    });

    // Effets actifs
    html.on('click', '.effect-control', (ev) => {
      const row      = ev.currentTarget.closest('li');
      const document = row.dataset.parentId === this.actor.id
        ? this.actor
        : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    // Bouton de lancer de dés — pré-remplit le bonus depuis les trademarks/edges actifs
    html.on('click', '.btn-open-roll', () => {
      let bonusDA = 0;
      for (const item of this.actor.items) {
        if (item.type !== 'trademark' || !item.system.active) continue;
        bonusDA++; // +1 par trademark actif
        for (let n = 1; n <= 5; n++) {
          if (item.system[`edge${n}`]?.trim() && item.system[`edge${n}_active`]) bonusDA++;
        }
      }
      NCORollDialog.show(this.actor, { bonusDA });
    });

    // Activer / désactiver un trademark
    html.on('click', '.tm-toggle', async (ev) => {
      const block  = $(ev.currentTarget).closest('.trademark-block');
      const itemId = block.data('itemId');
      const item   = this.actor.items.get(itemId);
      if (!item) return;
      const newActive = !item.system.active;
      const update = { 'system.active': newActive };
      // Désactiver toutes les edges si le trademark est désactivé
      if (!newActive) {
        for (let n = 1; n <= 5; n++) update[`system.edge${n}_active`] = false;
      }
      await item.update(update);
    });

    // Activer / désactiver un edge (seulement si le trademark parent est actif)
    html.on('click', '.edge-toggle', async (ev) => {
      ev.stopPropagation();
      const block  = $(ev.currentTarget).closest('.trademark-block');
      const itemId = block.data('itemId');
      const item   = this.actor.items.get(itemId);
      if (!item || !item.system.active) return;
      const field = ev.currentTarget.dataset.field;
      await item.update({ [`system.${field}_active`]: !item.system[`${field}_active`] });
    });

    // Cases cliquables
    html.on('click', '.hit-pip',   (ev) => this._onPipClick(ev, 'system.hits.value',         3));
    html.on('click', '.stash-pip', (ev) => this._onPipClick(ev, 'system.stash.value',        5));
    html.on('click', '.drive-pip', (ev) => this._onPipClick(ev, 'system.drive_track.value',  9));
    html.on('click', '.xp-pip',    (ev) => this._onPipClick(ev, 'system.xp.value',          15));
    html.on('click', '.stunt-pip', (ev) => this._onPipClick(ev, 'system.stunt_points.value', 3));

    // Drag & drop pour macros
    if (this.actor.isOwner) {
      const handler = (ev) => this._onDragStart(ev);
      html.find('[data-item-id]').each((i, el) => {
        el.setAttribute('draggable', true);
        el.addEventListener('dragstart', handler, false);
      });
    }
  }

  /**
   * Gère le clic sur une case de jauge (pip).
   * Cliquer sur une case remplie dépile jusqu'à cet index ; sur une vide, remplit jusqu'à lui.
   */
  async _onPipClick(event, fieldPath, maxVal) {
    event.preventDefault();
    const index   = parseInt(event.currentTarget.dataset.index);
    const current = foundry.utils.getProperty(this.actor.system, fieldPath.replace('system.', '')) ?? 0;
    const newValue = index < current ? index : index + 1;
    await this.actor.update({ [fieldPath]: Math.max(0, Math.min(maxVal, newValue)) });
  }

  /**
   * Crée un nouvel item possédé.
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header   = event.currentTarget;
    const type     = header.dataset.type;
    const data     = foundry.utils.duplicate(header.dataset);
    const name     = `Nouveau ${type}`;
    const itemData = { name, type, system: data };
    delete itemData.system['type'];
    return await Item.create(itemData, { parent: this.actor });
  }
}
