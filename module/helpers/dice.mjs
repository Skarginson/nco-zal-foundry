/**
 * Logique de résolution de dés pour Neon City Overdrive.
 *
 * Mécanique : pool de Dés d'Action (DA) vs Dés de Danger (DD), tous en d6.
 * On compare le meilleur DA au meilleur DD pour déterminer le résultat.
 *
 * Cas particulier : 0 DA → on lance 2 DD et on garde le plus bas (situation désespérée).
 */

/**
 * Résultats possibles d'un jet.
 * @enum {string}
 */
export const OUTCOME = {
  CRITICAL:  'critical',   // DA = 6, DA > DD
  SOLID:     'solid',      // DA = 5, DA > DD
  SUCCESS:   'success',    // DA = 4, DA > DD
  PARTIAL:   'partial',    // DA = 3 et DA > DD, ou DA = DD
  FAILURE:   'failure',    // DA < DD, ou DA <= 2 même si DA > DD
  DESPERATE: 'desperate',  // Situation désespérée (0 DA)
};

/**
 * Détermine le résultat narratif d'un jet.
 * @param {number} bestDA    - Meilleur dé d'Action
 * @param {number} bestDD    - Meilleur dé de Danger (null si désespéré)
 * @param {boolean} desperate - Situation désespérée (0 DA)
 * @returns {string} Un des codes de OUTCOME
 */
export function determineOutcome(bestDA, bestDD, desperate = false) {
  if (desperate) return OUTCOME.DESPERATE;

  if (bestDA > bestDD) {
    if (bestDA === 6) return OUTCOME.CRITICAL;
    if (bestDA === 5) return OUTCOME.SOLID;
    if (bestDA === 4) return OUTCOME.SUCCESS;
    if (bestDA === 3) return OUTCOME.PARTIAL;
    return OUTCOME.FAILURE; // DA = 1 ou 2, même si > DD
  }
  if (bestDA === bestDD) return OUTCOME.PARTIAL;
  return OUTCOME.FAILURE;
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
  let daResults = [];
  let ddResults = [];

  if (desperate) {
    // Situation désespérée : 2 DD, on garde le plus bas comme "résultat d'action"
    const ddRoll = await new Roll('2d6').evaluate();
    ddResults = ddRoll.dice[0].results.map((r) => r.result);
  } else {
    if (actionDice > 0) {
      const daRoll = await new Roll(`${actionDice}d6`).evaluate();
      daResults = daRoll.dice[0].results.map((r) => r.result);
    }
    if (dangerDice > 0) {
      const ddRoll = await new Roll(`${dangerDice}d6`).evaluate();
      ddResults = ddRoll.dice[0].results.map((r) => r.result);
    }
  }

  // Meilleurs dés de chaque pool
  const bestDA = desperate
    ? Math.min(...ddResults)       // désespéré : on garde le plus bas
    : daResults.length > 0
      ? Math.max(...daResults)
      : 0;

  const bestDD = desperate
    ? null
    : ddResults.length > 0
      ? Math.max(...ddResults)
      : 0;

  const outcome = determineOutcome(bestDA, bestDD ?? 0, desperate);

  const templateData = {
    actorName: actor.name,
    actorImg:  actor.img,
    traitLabel,
    daResults,
    ddResults,
    bestDA,
    bestDD,
    outcome,
    outcomeLabel: `NCO.Outcome.${outcome.charAt(0).toUpperCase() + outcome.slice(1)}`,
    desperate,
    // Pour la colorisation dans le template
    isSuccess: [OUTCOME.CRITICAL, OUTCOME.SOLID, OUTCOME.SUCCESS].includes(outcome),
    isPartial:  outcome === OUTCOME.PARTIAL,
    isFailure:  [OUTCOME.FAILURE, OUTCOME.DESPERATE].includes(outcome),
  };

  const html = await renderTemplate(
    'systems/neon-city-overdrive/templates/chat/roll-result.hbs',
    templateData
  );

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: html,
    rollMode: game.settings.get('core', 'rollMode'),
    flags: { 'neon-city-overdrive': { rollData: templateData } },
  });

  return templateData;
}
