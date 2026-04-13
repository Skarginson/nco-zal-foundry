import { rollPool } from '../helpers/dice.mjs';

/**
 * Dialog de configuration d'un jet de dés NCO.
 *
 * Dans NCO, on commence toujours avec 1 Dé d'Action de base.
 * Le joueur ajoute des DA selon la situation (trademark, edge, équipement, tags…)
 * et des DD pour les obstacles (traumatismes, conditions, scale…).
 *
 * @extends {Application}
 */
export class NCORollDialog extends Application {
  /**
   * @param {NCOActor} actor     - L'acteur qui lance les dés
   * @param {object}   [options] - Options Foundry Application
   */
  constructor(actor, options = {}) {
    super(options);
    this.actor    = actor;
    this.bonusDA  = options.bonusDA ?? 0;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/neon-city-overdrive/templates/dialog/roll-dialog.hbs',
      classes:  ['nco', 'roll-dialog'],
      width:    340,
      height:   'auto',
      resizable: false,
    });
  }

  /** @override */
  get title() {
    return game.i18n.format('NCO.Roll.DialogTitle', { actor: this.actor.name });
  }

  /** @override */
  getData() {
    return {
      actor:      this.actor,
      baseDice:   1,
      bonusDA:    this.bonusDA,
      dangerDice: 0,
      totalDA:    1 + this.bonusDA,
      totalDD:    0,
    };
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('input').on('input change', () => this._updateTotals(html));

    html.find('.btn-cancel').on('click', () => this.close());
    html.find('.btn-roll').on('click', () => this._onRoll(html));

    html.find('[name="danger-dice"]').focus();
  }

  /**
   * Recalcule et affiche les totaux DA / DD en temps réel.
   * @param {jQuery} html
   */
  _updateTotals(html) {
    const bonusDA    = parseInt(html.find('[name="bonus-da"]').val())    || 0;
    const dangerDice = parseInt(html.find('[name="danger-dice"]').val()) || 0;

    const totalDA = Math.max(0, 1 + bonusDA);
    const totalDD = Math.max(0, dangerDice);

    html.find('.total-da').text(totalDA);
    html.find('.total-dd').text(totalDD);

    // Avertissement situation désespérée (totalDA = 0, ce qui ne peut
    // arriver qu'avec un bonus négatif saisi manuellement)
    html.find('.desperate-warning').toggleClass('hidden', totalDA > 0);
  }

  /**
   * Lit le formulaire, lance les dés et ferme la dialog.
   * @param {jQuery} html
   */
  async _onRoll(html) {
    const bonusDA    = parseInt(html.find('[name="bonus-da"]').val())    || 0;
    const dangerDice = parseInt(html.find('[name="danger-dice"]').val()) || 0;

    const totalDA = Math.max(0, 1 + bonusDA);
    const totalDD = Math.max(0, dangerDice);

    await rollPool(this.actor, this.actor.name, totalDA, totalDD);
    this.close();
  }

  /**
   * Crée et affiche la dialog pour un acteur donné.
   * @param {NCOActor} actor
   */
  static async show(actor, options = {}) {
    new NCORollDialog(actor, options).render(true);
  }
}
