/**
 * Classe de document Item pour Neon City Overdrive.
 * @extends {Item}
 */
export class NCOItem extends Item {
  /** @override */
  prepareData() {
    super.prepareData();
  }

  /**
   * Fournit les données de roll pour les formules.
   * @override
   */
  getRollData() {
    const rollData = { ...this.system };
    if (!this.actor) return rollData;
    rollData.actor = this.actor.getRollData();
    return rollData;
  }

  /**
   * Affiche la description de l'item dans le chat.
   * La logique de lancer de dés est gérée par dice.mjs via la fiche d'acteur.
   */
  async roll() {
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${this.type}] ${this.name}`;

    ChatMessage.create({
      speaker,
      rollMode,
      flavor: label,
      content: this.system.description ?? '',
    });
  }
}
