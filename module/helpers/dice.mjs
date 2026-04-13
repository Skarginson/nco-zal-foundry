/**
 * Logique de résolution de dés pour Neon City Overdrive.
 *
 * Mécanique officielle (règles p.28) :
 * 1. Lancer le pool de Dés d'Action (DA) et de Dés de Danger (DD).
 * 2. Chaque DD annule un DA — les deux sont défaussés.
 *    Le DD efface toujours le DA le plus faible disponible.
 * 3. Trouver le DA le plus élevé parmi les dés restants → c'est le résultat.
 * 4. BOTCH si tous les DA sont annulés OU si les DA restants sont tous des 1.
 * 5. Chaque 6 supplémentaire restant = un Boon (exemple : 3 × 6 restants = 2 Boons).
 *
 * Situation désespérée (0 DA de départ) :
 * Lancer 2 DD et retenir le plus bas comme valeur effective.
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
 *   - Chaque DD efface le DA le plus faible encore disponible (depuis la fin).
 *   - Les DA restants forment le résultat.
 *
 * @param {number[]} daValues  - Valeurs brutes des dés d'action
 * @param {number}   ddCount   - Nombre de dés de danger
 * @returns {{
 *   daDisplay:  Array<{value:number, cancelled:boolean}>,
 *   remaining:  number[],
 *   cancelled:  number[],
 *   boons:      number,
 *   outcome:    string,
 * }}
 */
export function resolveDicePool(daValues, ddCount) {
  // Tri décroissant : index 0 = meilleur dé
  const sorted = [...daValues].sort((a, b) => b - a);

  const numCancelled = Math.min(ddCount, sorted.length);
  const remaining    = sorted.slice(0, sorted.length - numCancelled);
  const cancelled    = sorted.slice(sorted.length - numCancelled);

  // Tableau d'affichage : les N premiers sont actifs, le reste est annulé
  const daDisplay = sorted.map((value, idx) => ({
    value,
    cancelled: idx >= remaining.length,
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
  const desperate = actionDice <= 0;
  let daResults   = [];
  let ddResults   = [];
  let daDisplay   = [];
  let remaining   = [];
  let cancelled   = [];
  let boons       = 0;
  let outcome;
  let desperateBest = null;

  if (desperate) {
    // Situation désespérée : 2 DD, on garde le plus bas
    const ddRoll = await new Roll('2d6').evaluate();
    ddResults     = ddRoll.dice[0].results.map(r => r.result);
    desperateBest = Math.min(...ddResults);

    if (desperateBest <= 1)    outcome = OUTCOME.BOTCH;
    else if (desperateBest === 6) outcome = OUTCOME.SUCCESS;
    else if (desperateBest >= 4)  outcome = OUTCOME.PARTIAL;
    else                           outcome = OUTCOME.FAILURE;
  } else {
    if (actionDice > 0) {
      const daRoll = await new Roll(`${actionDice}d6`).evaluate();
      daResults = daRoll.dice[0].results.map(r => r.result);
    }
    if (dangerDice > 0) {
      const ddRoll = await new Roll(`${dangerDice}d6`).evaluate();
      ddResults = ddRoll.dice[0].results.map(r => r.result);
    }

    const resolved = resolveDicePool(daResults, dangerDice);
    daDisplay = resolved.daDisplay;
    remaining = resolved.remaining;
    cancelled = resolved.cancelled;
    boons     = resolved.boons;
    outcome   = resolved.outcome;
  }

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
    desperate,
    desperateBest,
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
