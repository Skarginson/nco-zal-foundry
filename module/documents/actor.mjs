/**
 * Classe de document Actor pour Neon City Overdrive.
 * Gère la préparation des données des personnages et PNJ.
 * @extends {Actor}
 */
export class NCOActor extends Actor {
  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Modifications appliquées avant les effets actifs
  }

  /** @override */
  prepareDerivedData() {
    const actorData = this;
    const flags = actorData.flags['neon-city-overdrive'] || {};

    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prépare les données spécifiques au type character.
   * Calcule le total de dés disponibles par trait.
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    const systemData = actorData.system;

    // Calcule le bonus de dés apporté par l'équipement pour chaque trait
    // (sera mis à jour en Phase 3 quand les items seront intégrés)
    for (const [key, trait] of Object.entries(systemData.traits)) {
      trait.total = trait.value;
    }
  }

  /**
   * Prépare les données spécifiques au type npc.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;
    // Les PNJ ont des pools fixes, pas de calcul dérivé pour l'instant
  }

  /**
   * Fournit les données de roll pour les formules de dés.
   * @override
   */
  getRollData() {
    const data = { ...this.system };

    if (this.type === 'character') {
      // Expose les valeurs de traits au niveau racine pour les formules
      for (const [key, trait] of Object.entries(data.traits)) {
        data[key] = trait.value;
      }
    }

    return data;
  }
}
