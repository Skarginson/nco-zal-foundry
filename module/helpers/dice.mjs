/**
 * Logique de résolution de dés pour Neon City Overdrive.
 *
 * Mécanique officielle (règles p.28) :
 * 1. Lancer le pool de Dés d'Action (DA) et de Dés de Danger (DD).
 * 2. Chaque DD annule un DA de MÊME VALEUR — les deux sont défaussés
 *    (un DD à 5 annule un DA à 5). Un DD sans DA correspondant est perdu.
 * 3. Trouver le DA le plus élevé parmi les dés restants → c'est le résultat.
 * 4. BOTCH si tous les DA sont annulés OU si les DA restants sont tous des 1.
 * 5. Chaque 6 supplémentaire restant = un Boon (exemple : 3 × 6 restants = 2 Boons).
 *
 * Il y a toujours au moins 1 DA dans le pool.
 */

/**
 * Résultats possibles d'un jet.
 * @enum {string}
 */
export const OUTCOME = {
  BOTCH:   'botch',
  FAILURE: 'failure',
  PARTIAL: 'partial',
  SUCCESS: 'success',
};

/**
 * Applique la mécanique d'annulation NCO sur des valeurs de DA déjà lancées.
 *
 * Algorithme :
 *   - Tri décroissant des DA (le plus fort en premier).
 *   - Chaque DD annule un DA de MÊME VALEUR encore disponible
 *     (un DD à 5 annule un DA à 5). Un DD sans correspondance est perdu.
 *   - Les DA non annulés forment le résultat.
 *
 * @param {number[]} daValues  - Valeurs brutes des dés d'action
 * @param {number[]} ddValues  - Valeurs brutes des dés de danger
 * @returns {{
 *   daDisplay:  Array<{value:number, cancelled:boolean}>,
 *   remaining:  number[],
 *   cancelled:  number[],
 *   boons:      number,
 *   outcome:    string,
 * }}
 */
export function resolveDicePool(daValues, ddValues) {
  // Tri décroissant : index 0 = meilleur dé
  const sorted = [...daValues].sort((a, b) => b - a);

  // Chaque DD annule un DA affichant la même valeur (une seule fois).
  const cancelledFlags = new Array(sorted.length).fill(false);
  for (const dd of ddValues) {
    const idx = sorted.findIndex((v, i) => !cancelledFlags[i] && v === dd);
    if (idx !== -1) cancelledFlags[idx] = true;
  }

  const remaining = sorted.filter((_, idx) => !cancelledFlags[idx]);
  const cancelled = sorted.filter((_, idx) => cancelledFlags[idx]);

  // Tableau d'affichage : conserve l'ordre trié, marque les DA annulés
  const daDisplay = sorted.map((value, idx) => ({
    value,
    cancelled: cancelledFlags[idx],
  }));

  // BOTCH : plus aucun DA restant, ou tous les restants sont des 1
  if (remaining.length === 0 || remaining.every(v => v === 1)) {
    return { daDisplay, remaining, cancelled, boons: 0, outcome: OUTCOME.BOTCH };
  }

  const best     = remaining[0]; // déjà le plus haut (tri décroissant)
  const sixCount = remaining.filter(v => v === 6).length;
  const boons    = best === 6 ? sixCount - 1 : 0;

  let outcome;
  if (best === 6)     outcome = OUTCOME.SUCCESS;
  else if (best >= 4) outcome = OUTCOME.PARTIAL;
  else                outcome = OUTCOME.FAILURE;

  return { daDisplay, remaining, cancelled, boons, outcome };
}

/**
 * Lance un pool de dés d'Action vs dés de Danger et envoie le résultat au chat.
 *
 * @param {NCOActor} actor       - L'acteur qui effectue le jet
 * @param {string}   traitLabel  - Label localisé du trait utilisé
 * @param {number}   actionDice  - Nombre de dés d'Action
 * @param {number}   dangerDice  - Nombre de dés de Danger
 * @returns {Promise<object>}    - Données du résultat
 */
export async function rollPool(actor, traitLabel, actionDice, dangerDice) {
  // Il y a toujours au moins 1 DA dans le pool.
  const daCount = Math.max(1, actionDice);
  let daResults = [];
  let ddResults = [];

  const daRoll = await new Roll(`${daCount}d6`).evaluate();
  daResults = daRoll.dice[0].results.map(r => r.result);

  if (dangerDice > 0) {
    const ddRoll = await new Roll(`${dangerDice}d6`).evaluate();
    ddResults = ddRoll.dice[0].results.map(r => r.result);
  }

  const { daDisplay, remaining, cancelled, boons, outcome } =
    resolveDicePool(daResults, ddResults);

  const outcomeKey   = outcome.charAt(0).toUpperCase() + outcome.slice(1);
  const outcomeLabel = `NCO.Outcome.${outcomeKey}`;

  const templateData = {
    actorName:     actor.name,
    actorImg:      actor.img,
    traitLabel,
    daResults,
    ddResults,
    daDisplay,
    remaining,
    cancelled,
    boons,
    outcome,
    outcomeLabel,
    isSuccess: outcome === OUTCOME.SUCCESS,
    isPartial: outcome === OUTCOME.PARTIAL,
    isFailure: outcome === OUTCOME.FAILURE,
    isBotch:   outcome === OUTCOME.BOTCH,
  };

  const html = await foundry.applications.handlebars.renderTemplate(
    'systems/neon-city-overdrive/templates/chat/roll-result.hbs',
    templateData
  );

  await ChatMessage.create({
    speaker:  ChatMessage.getSpeaker({ actor }),
    content:  html,
    rollMode: game.settings.get('core', 'rollMode'),
    flags:    { 'neon-city-overdrive': { rollData: templateData } },
  });

  return templateData;
}
