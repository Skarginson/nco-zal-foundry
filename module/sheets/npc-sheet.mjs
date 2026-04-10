import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { rollPool } from '../helpers/dice.mjs';

/**
 * Feuille de PNJ pour Neon City Overdrive.
 * Les PNJ ont des pools de dés fixes et une fiche simplifiée.
 * @extends {ActorSheet}
 */
export class NCONPCSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['nco', 'sheet', 'actor', 'npc'],
      width: 480,
      height: 480,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'stats',
        },
      ],
    });
  }

  /** @override */
  get template() {
    return 'systems/neon-city-overdrive/templates/actor/actor-npc-sheet.hbs';
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = super.getData();
    const actorData = this.document.toObject(false);

    context.system = actorData.system;
    context.flags = actorData.flags;
    context.config = CONFIG.NCO;

    // Enrichissement des notes MJ
    context.enrichedNotes = await TextEditor.enrichHTML(
      this.actor.system.notes,
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

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    // Gestion des effets actifs
    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    // Lancer les dés du PNJ
    html.on('click', '.npc-roll', async (ev) => {
      ev.preventDefault();
      const da = this.actor.system.action_dice;
      const dd = this.actor.system.danger_dice;
      await rollPool(this.actor, this.actor.name, da, dd);
    });
  }
}
