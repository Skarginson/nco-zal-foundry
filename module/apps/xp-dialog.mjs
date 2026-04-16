const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * Dialog d'avancement XP pour Neon City Overdrive.
 * Résout une promesse avec les données du formulaire ou null si annulé.
 */
export class NCOXPDialog extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    classes:  ['nco', 'xp-dialog'],
    position: { width: 340, height: 'auto' },
    window:   { resizable: false },
    actions: {
      confirm: NCOXPDialog._onConfirm,
      cancel:  NCOXPDialog._onCancel,
    },
  };

  static PARTS = {
    main: {
      template: 'systems/neon-city-overdrive/templates/dialog/xp-dialog.hbs',
    },
  };

  constructor(actor, options = {}) {
    options.id = `nco-xp-dialog-${actor.id}`;
    super(options);
    this.actor    = actor;
    this._resolve = null;
  }

  get title() {
    return game.i18n.localize('NCO.XP.SpendTitle');
  }

  /** @override */
  async _prepareContext(options) {
    const sys      = this.actor.system;
    const hitsMax  = sys.hits?.max            ?? 3;
    const stuntMax = sys.stunt_points?.max    ?? 3;
    const trademarks = this.actor.items.filter(i => i.type === 'trademark');

    const eligibleTm = trademarks.filter(tm =>
      [1, 2, 3, 4, 5].some(n => !tm.system[`edge${n}`]?.trim())
    );

    const canTm    = trademarks.length < 5;
    const canEdge  = eligibleTm.length > 0;
    const canHits  = hitsMax < 4;
    const canStunt = stuntMax < 5;

    const firstChecked = canTm ? 'trademark' : canEdge ? 'edge' : canHits ? 'hits' : 'stunt';

    return {
      canTm,
      canEdge,
      canHits,
      canStunt,
      firstChecked,
      tmCount:    trademarks.length,
      hitsMax,
      stuntMax,
      eligibleTm: eligibleTm.map(tm => ({ id: tm.id, name: tm.name })),
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    // Affiche/masque le sélecteur de trademark selon le radio sélectionné
    const form     = this.element.querySelector('form');
    const tmSelect = form?.querySelector('.xp-tm-select-wrap');
    const radios   = form?.querySelectorAll('input[name="advancement"]');
    if (!tmSelect || !radios) return;

    const sync = () => {
      const checked = form.querySelector('input[name="advancement"]:checked');
      tmSelect.hidden = checked?.value !== 'edge';
    };

    radios.forEach(r => r.addEventListener('change', sync));
    sync();
  }

  /* -------------------------------------------- */

  static _onCancel(event, target) {
    this._resolve?.(null);
    this.close();
  }

  static _onConfirm(event, target) {
    const form = this.element.querySelector('form');
    const data = form ? new FormDataExtended(form).object : null;
    this._resolve?.(data);
    this.close();
  }

  /**
   * Affiche le dialog et retourne une promesse résolue avec les données choisies,
   * ou null si l'utilisateur annule.
   */
  static show(actor) {
    return new Promise(resolve => {
      const dialog  = new NCOXPDialog(actor);
      dialog._resolve = resolve;
      dialog.render({ force: true });
    });
  }
}
