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
      width: 680,
      height: 700,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'principal',
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

    context.system = actorData.system;
    context.flags = actorData.flags;
    context.config = CONFIG.NCO;

    // Mode de jeu courant (nco_standard | zalozhniy)
    context.gameMode     = game.settings.get('neon-city-overdrive', 'gameMode');
    context.isZalozhniy  = context.gameMode === 'zalozhniy';
    context.sanityEnabled = game.settings.get('neon-city-overdrive', 'sanityEnabled');

    // Labels des traits selon le mode actif
    context.traitLabels = context.isZalozhniy
      ? CONFIG.NCO.traitsZalozhniy
      : CONFIG.NCO.traits;

    // Données Zalozhniy : jauge d'exposition et état critique
    if (context.isZalozhniy) {
      const exposure = actorData.system.exposure?.value ?? 0;
      context.exposureCritical = exposure >= 5;
      // Génère les 6 cases (0-5) pour la jauge visuelle
      context.exposureSteps = Array.from({ length: 6 }, (_, i) => ({
        filled:   i < exposure,
        critical: i === 4,
      }));
    }

    // Prépare les items triés par type
    this._prepareItems(context);

    // Enrichissement du texte de biographie
    context.enrichedBiography = await TextEditor.enrichHTML(
      this.actor.system.biography,
      {
        secrets: this.document.isOwner,
        async: true,
        rollData: this.actor.getRollData(),
        relativeTo: this.actor,
      }
    );

    // Effets actifs
    context.effects = prepareActiveEffectCategories(
      this.actor.allApplicableEffects()
    );

    return context;
  }

  /**
   * Trie et classe les items par type pour affichage dans la fiche.
   * @param {object} context
   */
  _prepareItems(context) {
    const gear     = [];
    const moves    = [];
    const contacts = [];
    const tags     = [];
    const assets   = [];
    const threats  = [];

    for (const item of context.items) {
      item.img = item.img || Item.DEFAULT_ICON;
      switch (item.type) {
        case 'gear':    gear.push(item);     break;
        case 'move':    moves.push(item);    break;
        case 'contact': contacts.push(item); break;
        case 'tag':     tags.push(item);     break;
        case 'asset':   assets.push(item);   break;
        case 'threat':  threats.push(item);  break;
      }
    }

    context.gear     = gear;
    context.moves    = moves;
    context.contacts = contacts;
    context.tags     = tags;
    context.assets   = assets;
    context.threats  = threats;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Ouvrir la fiche d'un item au clic sur son nom
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // Afficher/masquer la description d'un item
    html.on('click', '.item-name', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const description = li.find('.item-description');
      description.slideToggle(150);
    });

    if (!this.isEditable) return;

    // Créer un item
    html.on('click', '.item-create', this._onItemCreate.bind(this));

    // Supprimer un item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Gestion des effets actifs
    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    // Lancer de dés sur les traits — ouvre la dialog de configuration
    html.on('click', '.trait-roll', this._onTraitRoll.bind(this));

    // Clic sur une case d'Exposition (Zalozhniy)
    html.on('click', '.exposure-pip', this._onExposureClick.bind(this));

    // Drag & drop pour macros
    if (this.actor.isOwner) {
      const handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }
  }

  /**
   * Crée un nouvel item possédé depuis les données du dataset HTML.
   * @param {Event} event
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = duplicate(header.dataset);
    const name = `Nouveau ${type}`;
    const itemData = { name, type, system: data };
    delete itemData.system['type'];
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Gère le clic sur un trait : ouvre la dialog de configuration du jet.
   * @param {Event} event
   */
  _onTraitRoll(event) {
    event.preventDefault();
    const trait = event.currentTarget.dataset.trait;
    NCORollDialog.show(this.actor, trait);
  }

  /**
   * Gère le clic sur une case de la jauge d'Exposition pour la modifier directement.
   * @param {Event} event
   */
  async _onExposureClick(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);
    const current = this.actor.system.exposure?.value ?? 0;
    // Clic sur la case déjà remplie la plus haute → décrémente, sinon → incrémente
    const newValue = index < current ? index : index + 1;
    await this.actor.update({ 'system.exposure.value': Math.clamped(newValue, 0, 5) });
  }
}
