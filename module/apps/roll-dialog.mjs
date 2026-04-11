import { rollPool } from '../helpers/dice.mjs';

/**
 * Dialog de configuration d'un jet de dés NCO.
 *
 * Permet au joueur de saisir :
 * - Le bonus en DA issu de l'équipement
 * - L'aide d'un allié (+1 DA)
 * - Les dés de Danger imposés par la situation
 *
 * @extends {Application}
 */
export class NCORollDialog extends Application {
  /**
   * @param {NCOActor} actor       - L'acteur qui lance les dés
   * @param {string}   trait       - Clé du trait (body, reflex, mind, presence)
   * @param {object}   [options]   - Options Foundry Application
   */
  constructor(actor, trait, options = {}) {
    super(options);
    this.actor      = actor;
    this.trait      = trait;
    // La Couverture est stockée dans system.cover.value, pas dans system.traits
    this.traitValue = trait === 'cover'
      ? (actor.system.cover?.value ?? 2)
      : (actor.system.traits[trait]?.value ?? 0);
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
    return game.i18n.format('NCO.Roll.DialogTitle', {
      trait: game.i18n.localize(this._traitLabel()),
    });
  }

  /** Retourne le label localisé du trait selon le mode de jeu actif. */
  _traitLabel() {
    if (this.trait === 'cover') return 'NCO.Zalozhniy.Cover';
    const isZalozhniy =
      game.settings.get('neon-city-overdrive', 'gameMode') === 'zalozhniy';
    const labels = isZalozhniy ? CONFIG.NCO.traitsZalozhniy : CONFIG.NCO.traits;
    return labels[this.trait] ?? `NCO.Trait.${this.trait}`;
  }

  /** @override */
  getData() {
    return {
      actor:       this.actor,
      trait:       this.trait,
      traitLabel:  game.i18n.localize(this._traitLabel()),
      traitValue:  this.traitValue,
      bonusDA:     0,
      allyHelp:    false,
      dangerDice:  0,
      totalDA:     this.traitValue,
      totalDD:     0,
    };
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Mise à jour en temps réel des totaux
    html.find('input').on('input change', () => this._updateTotals(html));

    html.find('.btn-cancel').on('click', () => this.close());
    html.find('.btn-roll').on('click', () => this._onRoll(html));

    // Focus sur le champ dés de danger à l'ouverture
    html.find('[name="danger-dice"]').focus();
  }

  /**
   * Recalcule et affiche les totaux DA / DD en temps réel.
   * @param {jQuery} html
   */
  _updateTotals(html) {
    const bonusDA   = parseInt(html.find('[name="bonus-da"]').val())    || 0;
    const allyHelp  = html.find('[name="ally-help"]').is(':checked') ? 1 : 0;
    const dangerDice = parseInt(html.find('[name="danger-dice"]').val()) || 0;

    const totalDA = Math.max(0, this.traitValue + bonusDA + allyHelp);
    const totalDD = Math.max(0, dangerDice);

    html.find('.total-da').text(totalDA);
    html.find('.total-dd').text(totalDD);

    // Avertissement situation désespérée
    html.find('.desperate-warning').toggleClass('hidden', totalDA > 0);
  }

  /**
   * Lit le formulaire, lance les dés et ferme la dialog.
   * @param {jQuery} html
   */
  async _onRoll(html) {
    const bonusDA    = parseInt(html.find('[name="bonus-da"]').val())    || 0;
    const allyHelp   = html.find('[name="ally-help"]').is(':checked') ? 1 : 0;
    const dangerDice = parseInt(html.find('[name="danger-dice"]').val()) || 0;

    const totalDA = Math.max(0, this.traitValue + bonusDA + allyHelp);
    const totalDD = Math.max(0, dangerDice);

    const traitLabel = game.i18n.localize(this._traitLabel());

    await rollPool(this.actor, traitLabel, totalDA, totalDD);
    this.close();
  }

  /**
   * Crée et affiche la dialog pour un trait donné.
   * Point d'entrée principal depuis les fiches.
   *
   * @param {NCOActor} actor
   * @param {string}   trait
   */
  static async show(actor, trait) {
    new NCORollDialog(actor, trait).render(true);
  }
}
