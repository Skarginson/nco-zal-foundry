import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { NCORollDialog } from '../apps/roll-dialog.mjs';

/**
 * Feuille de personnage (character) pour Neon City Overdrive.
 * @extends {ActorSheet}
 */
export class NCOActorSheet extends ActorSheet {
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
    const hitsVal      = sys.hits?.value      ?? 0;
    const stashVal     = sys.stash?.value     ?? 0;
    const driveTrackVal = sys.drive_track?.value ?? 0;
    const xpVal        = sys.xp?.value        ?? 0;

    context.hitBoxes   = Array.from({ length: 3 }, (_, i) => ({ filled: i < hitsVal,       index: i }));
    context.stashBoxes = Array.from({ length: 5 }, (_, i) => ({ filled: i < stashVal,      index: i }));
    context.driveBoxes = Array.from({ length: 9 }, (_, i) => ({ filled: i < driveTrackVal, index: i }));

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
          // Pré-calcule un tableau ordonné des edges pour le template
          item.edgesArray = [
            { field: 'edge1', value: item.system.edge1 },
            { field: 'edge2', value: item.system.edge2 },
            { field: 'edge3', value: item.system.edge3 },
            { field: 'edge4', value: item.system.edge4 },
            { field: 'edge5', value: item.system.edge5 },
          ];
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
    html.on('click', '.item-edit', (ev) => {
      const li   = $(ev.currentTarget).parents('[data-item-id]');
      const item = this.actor.items.get(li.data('itemId'));
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

    // Édition inline : nom du trademark
    html.on('change', '.trademark-name-input', async (ev) => {
      const block  = $(ev.currentTarget).closest('.trademark-block');
      const itemId = block.data('itemId');
      const item   = this.actor.items.get(itemId);
      if (item) await item.update({ name: ev.currentTarget.value });
    });

    // Édition inline : edge d'un trademark
    html.on('change', '.trademark-edge-input', async (ev) => {
      const block  = $(ev.currentTarget).closest('.trademark-block');
      const itemId = block.data('itemId');
      const item   = this.actor.items.get(itemId);
      if (item) await item.update({ [`system.${ev.currentTarget.dataset.field}`]: ev.currentTarget.value });
    });

    // Effets actifs
    html.on('click', '.effect-control', (ev) => {
      const row      = ev.currentTarget.closest('li');
      const document = row.dataset.parentId === this.actor.id
        ? this.actor
        : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    // Bouton de lancer de dés
    html.on('click', '.btn-open-roll', () => NCORollDialog.show(this.actor));

    // Cases cliquables : Hits
    html.on('click', '.hit-pip', (ev) =>
      this._onPipClick(ev, 'system.hits.value', 3)
    );
    // Cases cliquables : Stash
    html.on('click', '.stash-pip', (ev) =>
      this._onPipClick(ev, 'system.stash.value', 5)
    );
    // Cases cliquables : Drive track
    html.on('click', '.drive-pip', (ev) =>
      this._onPipClick(ev, 'system.drive_track.value', 9)
    );
    // Cases cliquables : XP
    html.on('click', '.xp-pip', (ev) =>
      this._onPipClick(ev, 'system.xp.value', 15)
    );

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
