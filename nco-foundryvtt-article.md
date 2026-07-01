---
title: "Coder un système FoundryVTT from scratch : l'aventure Neon City Overdrive"
date: 2026-04-27
draft: false
tags: ["foundry", "gamedev", "javascript", "tabletop", "neon-city-overdrive"]
summary: "Comment j'ai implémenté le système de jeu Neon City Overdrive dans FoundryVTT — des mécaniques de dés aux fiches de personnage, en passant par les pièges de l'API moderne AppV2."
---

Il y a quelque chose d'un peu fou à vouloir coder son propre système de jeu de rôle dans FoundryVTT. Ce n'est pas que c'est difficile en soi — c'est que ça force à comprendre en profondeur deux choses à la fois : les règles du jeu, et l'architecture d'une plateforme VTT. Cet article raconte comment j'ai développé un système non officiel pour **Neon City Overdrive** (Peter Rudin-Burgess / Free League Publishing), de la première ligne de code jusqu'à une version beta jouable.

---

## Pourquoi Neon City Overdrive ?

NCO est un jeu de rôle cyberpunk élégant et nerveux. Son système de résolution est minimal mais plein de tension : on constitue un pool de **dés d'Action** (DA) et de **dés de Danger** (DD), tous en d6. Les DD *annulent* les DA — pas en les retirant du pool, mais en les effaçant valeur contre valeur. Ce qui reste, c'est votre résultat.

C'est le genre de mécanique qui se prête bien à une implémentation informatique : déterministe, visuelle, dramatique. Et FoundryVTT n'avait pas de système officiel pour ce jeu. Occasion rêvée.

---

## Les fondations : choisir l'API moderne

FoundryVTT a deux générations d'API pour les interfaces : **ApplicationV1** (la vieille, simple, largement documentée) et **ApplicationV2** (la nouvelle, plus structurée, encore peu d'exemples dans la nature). J'ai choisi AppV2 dès le départ.

La raison : AppV2 impose une séparation claire entre le rendu Handlebars et les gestionnaires d'événements. Chaque action utilisateur passe par une méthode `_onAction` typée, ce qui élimine une grande source d'erreurs. On déclare ses `actions` dans la configuration de la classe, et Foundry câble les événements automatiquement. C'est plus verbeux au début, mais beaucoup plus maintenable.

```js
static DEFAULT_OPTIONS = {
  classes: ["nco", "sheet", "actor"],
  position: { width: 700, height: 700 },
  actions: {
    toggleTrademark: NCOActorSheet._onToggleTrademark,
    rollDice: NCOActorSheet._onRollDice,
    spendXP: NCOActorSheet._onSpendXP,
    // ...
  }
};
```

L'autre avantage d'AppV2 : le cycle de vie du rendu est explicite. On implémente `_prepareContext()` pour préparer les données, et Handlebars reçoit exactement ce dont il a besoin — pas de magie implicite.

---

## La mécanique centrale : résoudre un pool de dés

Le cœur du système, c'est la fonction `resolveDicePool()`. Elle implémente fidèlement la règle d'annulation de NCO :

> Chaque DD annule le DA de valeur identique ou inférieure la plus haute.

Autrement dit, un DD à 5 efface un DA à 5. S'il n'y a pas de DA à 5, il efface le DA à 4, etc. L'ordre des annulations change parfois le résultat quand plusieurs DD sont en jeu.

```js
export function resolveDicePool(actionDice, dangerDice) {
  const ad = [...actionDice].sort((a, b) => b - a); // desc
  const cancelled = new Array(ad.length).fill(false);

  for (const dd of dangerDice) {
    // Trouve le DA le plus faible >= dd à annuler
    for (let i = ad.length - 1; i >= 0; i--) {
      if (!cancelled[i] && ad[i] >= dd) {
        cancelled[i] = true;
        break;
      }
    }
  }

  const remaining = ad.filter((_, i) => !cancelled[i]);
  // ...
}
```

Trier les DA dans l'ordre décroissant avant d'annuler depuis la fin garantit qu'on sacrifie toujours le DA *le moins utile* — ce qui correspond à l'intention des règles.

Le cas particulier de la **situation désespérée** (0 DA disponibles) est géré séparément : on lance 2 DD et on lit le plus bas. Dramatiquement approprié.

---

## La fiche de personnage : architecture des données

Un personnage NCO, c'est :

- Jusqu'à **5 Trademarks** (identités), chacune portant jusqu'à **5 Edges** activables
- Un **état** (Hits, Conditions, Traumas, Stunt Points)
- De l'**équipement** (basique ou spécial avec tags activables)
- Une **progression** (XP sur 15 cases, Drive, Stash)

Le choix structurel que j'ai fait : stocker les Trademarks et le Gear comme des **Items FoundryVTT** liés à l'acteur, plutôt que comme des données embarquées dans `system`. Ça permet d'utiliser les mécanismes natifs de Foundry (drag-and-drop, bibliothèques d'items, effets actifs).

En contrepartie, `_prepareContext()` doit reconstruire des structures enrichies à chaque rendu :

```js
_prepareItems(context) {
  const trademarks = [];
  for (const item of this.actor.items) {
    if (item.type === "trademark") {
      trademarks.push({
        ...item,
        edgesArray: [1,2,3,4,5].map(i => ({
          index: i,
          value: item.system[`edge${i}`] ?? "",
          active: item.system[`edge${i}_active`] ?? false,
        }))
      });
    }
  }
  context.trademarks = trademarks;
}
```

Ce n'est pas la solution la plus élégante — des tableaux natifs seraient plus propres — mais elle fonctionne de façon fiable dans les contraintes du système de données de Foundry V14.

---

## Le piège du formulaire imbriqué

AppV2 utilise par défaut `FormDataExtended` pour lire l'état du formulaire à la soumission. Problème : quand des champs d'un Item (Trademark, Gear) sont affichés dans la fiche de l'acteur, les valeurs soumises ne correspondent pas au bon document.

La solution : **ne pas utiliser la soumission de formulaire pour les champs d'items**. Chaque modification d'un Edge ou d'un Tag passe par un gestionnaire `change` qui appelle directement `item.update()` :

```js
static async _onEdgeChange(event, target) {
  const itemId = target.closest("[data-item-id]").dataset.itemId;
  const field = target.dataset.field; // "edge1", "edge2", ...
  const item = this.actor.items.get(itemId);
  await item.update({ [`system.${field}`]: target.value });
}
```

C'est plus verbeux, mais ça évite toute ambiguïté sur quel document est mis à jour.

---

## Les Traumas : une DD automatique

Chaque Trauma rempli (parmi les 8 champs texte) ajoute automatiquement 1 DD au jet. C'est une règle de NCO, et l'implémenter correctement demande de compter les Traumas *au moment où le dialog de jet s'ouvre*, pas au moment où on clique sur "Lancer".

```js
static async _onRollDice(event, target) {
  const traumaCount = [1,2,3,4,5,6,7,8]
    .filter(i => !!actor.system[`trauma${i}`]?.trim())
    .length;

  const dialog = new NCORollDialog({ actor, traumaDD: traumaCount, ... });
  dialog.render(true);
}
```

Le dialog affiche ces DD de Trauma séparément des DD manuels, pour que le joueur comprenne d'où vient son handicap.

---

## L'avancement par XP

Le système d'XP de NCO est discret : on dépense 5 XP pour débloquer une amélioration. Les options disponibles dépendent de l'état actuel du personnage (déjà 5 Trademarks ? On ne peut plus en ajouter). J'ai implémenté ça comme un dialog modal qui calcule les options valides au moment de l'ouverture :

```js
_computeOptions(actor) {
  const options = [];
  const tmCount = actor.items.filter(i => i.type === "trademark").length;

  if (tmCount < 5)
    options.push({ id: "new_trademark", label: "Nouveau Trademark" });
  if (actor.system.hits.max < 4)
    options.push({ id: "increase_hits", label: "Max Hits → 4" });
  if (actor.system.stunt_points.max < 5)
    options.push({ id: "increase_stunt", label: "Max Stunt Points → 5" });
  // ...
  return options;
}
```

Chaque option montre son coût (5 XP) et vérifie que le personnage a les fonds avant d'autoriser la dépense.

---

## L'interface : des cases à cliquer partout

NCO est un jeu visuel, et j'ai voulu que la fiche le soit aussi. Tous les trackers — Hits, Stunt Points, XP, Stash, Drive — sont des rangées de **cases cliquables**, pas des champs numériques. Le Drive a même trois états par case (vide / coché / barré).

```hbs
{{#each system.drive_track.boxes as |state index|}}
  <div class="pip drive-pip {{#if (eq state 1)}}ticked{{/if}}{{#if (eq state 2)}}crossed{{/if}}"
       data-index="{{index}}"
       data-action="cycleDrivePip">
  </div>
{{/each}}
```

Le gestionnaire fait défiler les états en modulo 3 :

```js
static async _onCycleDrivePip(event, target) {
  const index = parseInt(target.dataset.index);
  const boxes = [...this.actor.system.drive_track.boxes];
  boxes[index] = (boxes[index] + 1) % 3;
  await this.actor.update({ "system.drive_track.boxes": boxes });
}
```

Petit détail qui change beaucoup à la table.

---

## La typographie et le CSS

J'ai soigné l'aspect visuel dès le début. La fiche utilise deux polices Google Fonts :
- **EB Garamond** pour les titres et noms (serif élégant, ambiance néo-noir)
- **Source Sans 3** pour les labels et données (lisible, propre)

Le tout avec des variables CSS pour maintenir la cohérence :

```css
:root {
  --nco-primary: #1a1a2e;
  --nco-accent: #e94560;
  --nco-text: #f0e6d3;
}
```

Le rendu final rappelle les jeux de Free League : sobre, sérieux, avec une touche de rouge sang.

---

## État actuel et suite

Le système est en **version 0.1.0-beta**, jouable de bout en bout :

- Fiches personnage et PNJ complètes
- Jet de dés avec toutes les mécaniques (annulation, situation désespérée, boons)
- Avancement par XP
- Localisation FR / EN
- Compatibilité Foundry v12+ vérifiée sur v14

Ce qui manque encore : les macros de compendium, peut-être un journal de règles intégré, et sûrement du polish sur les cas limites que seule une vraie campagne fait émerger.

---

Coder ce système m'a appris autant sur FoundryVTT que sur NCO lui-même. Quand on doit implémenter une règle dans du code, on la comprend différemment — on découvre ses cas limites, ses ambiguïtés, ses interactions. C'est une des choses que j'aime dans le développement d'outils pour les jeux de rôle : le code et le jeu se répondent.

Le dépôt est disponible sur GitHub si vous voulez creuser, contribuer, ou simplement jouer à NCO en VTT.
