import { onManageActiveEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';

/**
 * Feuille de PNJ (menace) pour Neon City Overdrive.
 *
 * Dans NCO, seuls les joueurs lancent des dés (règle p.28).
 * La fiche de menace sert de référence au MJ : hits, drive, actions et tags.
 * Les danger_dice indiquent combien de DD les tags de cette menace ajoutent
 * aux jets des joueurs qui agissent contre elle.
 *
 * @extends {ActorSheet}
 */
export class NCONPCSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['nco', 'sheet', 'actor', 'npc'],
      width: 480,
      height: 520,
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
    context.flags  = actorData.flags;
    context.config = CONFIG.NCO;

    context.enrichedNotes = await TextEditor.enrichHTML(
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
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });
  }
}
