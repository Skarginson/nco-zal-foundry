/**
 * Classe de document Actor pour Neon City Overdrive.
 * @extends {Actor}
 */
export class NCOActor extends Actor {
  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {}

  /** @override */
  prepareDerivedData() {
    if (this.type === 'npc') this._prepareNpcData();
  }

  /**
   * Prépare les données spécifiques au type npc.
   * Les PNJ ont des pools fixes définis manuellement sur leur fiche.
   */
  _prepareNpcData() {}

  /** @override */
  getRollData() {
    return { ...this.system };
  }
}
