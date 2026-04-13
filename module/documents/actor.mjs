/**
 * Classe de document Actor pour Neon City Overdrive.
 * @extends {Actor}
 */
export class NCOActor extends Actor {
  /** @override */
  prepareDerivedData() {
    if (this.type === 'npc') this._prepareNpcData();
  }

  _prepareNpcData() {}

  /** @override */
  getRollData() {
    return { ...this.system };
  }
}
