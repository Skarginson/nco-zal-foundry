import { rollPool } from '../helpers/dice.mjs';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * Dialog de configuration d'un jet de dés NCO.
 */
export class NCORollDialog extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    classes:  ['nco', 'roll-dialog'],
    position: { width: 340, height: 'auto' },
    window:   { resizable: false },
    actions: {
      cancel: NCORollDialog._onCancel,
      roll:   NCORollDialog._onRoll,
    },
  };

  static PARTS = {
    main: {
      template: 'systems/neon-city-overdrive/templates/dialog/roll-dialog.hbs',
    },
  };

  constructor(actor, options = {}) {
    const { bonusDA = 0, traumaDD = 0, ...appOptions } = options;
    // ID unique par acteur pour éviter les doublons
    appOptions.id = `nco-roll-dialog-${actor.id}`;
    super(appOptions);
    this.actor    = actor;
    this.bonusDA  = bonusDA;
    this.traumaDD = traumaDD;
  }

  /** @override */
  get title() {
    return game.i18n.format('NCO.Roll.DialogTitle', { actor: this.actor.name });
  }

  /** @override */
  async _prepareContext(options) {
    return {
      actor:      this.actor,
      baseDice:   1,
      bonusDA:    this.bonusDA,
      traumaDD:   this.traumaDD,
      totalDA:    1 + this.bonusDA,
      totalDD:    this.traumaDD,
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    // Mise à jour des totaux en temps réel
    this.element.querySelectorAll('input[type="number"]').forEach((input) => {
      input.addEventListener('input', () => this._updateTotals());
    });

    this._updateTotals();
    this.element.querySelector('[name="danger-dice"]')?.focus();
  }

  /**
   * Recalcule et affiche les totaux DA / DD.
   */
  _updateTotals() {
    const bonusDA    = parseInt(this.element.querySelector('[name="bonus-da"]')?.value)    || 0;
    const dangerDice = parseInt(this.element.querySelector('[name="danger-dice"]')?.value) || 0;
    const totalDA    = Math.max(0, 1 + bonusDA);
    const totalDD    = Math.max(0, this.traumaDD + dangerDice);

    this.element.querySelector('.total-da').textContent = totalDA;
    this.element.querySelector('.total-dd').textContent = totalDD;
    this.element.querySelector('.desperate-warning')?.classList.toggle('hidden', totalDA > 0);
  }

  /* -------------------------------------------- */
  /* Action Handlers                               */
  /* -------------------------------------------- */

  static _onCancel(event, target) {
    this.close();
  }

  static async _onRoll(event, target) {
    const bonusDA    = parseInt(this.element.querySelector('[name="bonus-da"]')?.value)    || 0;
    const dangerDice = parseInt(this.element.querySelector('[name="danger-dice"]')?.value) || 0;
    const totalDA    = Math.max(0, 1 + bonusDA);
    const totalDD    = Math.max(0, this.traumaDD + dangerDice);

    await rollPool(this.actor, this.actor.name, totalDA, totalDD);
    this.close();
  }

  /**
   * Crée et affiche la dialog pour un acteur donné.
   */
  static async show(actor, options = {}) {
    new NCORollDialog(actor, options).render({ force: true });
  }
}
