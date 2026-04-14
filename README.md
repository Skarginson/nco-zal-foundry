# Neon City Overdrive — FoundryVTT System

![Foundry v12+](https://img.shields.io/badge/foundry-v12%2B-green)
![Verified v13](https://img.shields.io/badge/verified-v13-brightgreen)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Langues](https://img.shields.io/badge/langues-FR%20%7C%20EN-lightgrey)

Système FoundryVTT non officiel pour **Neon City Overdrive** (Peter Rudin-Burgess / Free League Publishing).

---

## Mécanique centrale

NCO repose sur un pool de **dés d'Action (DA)** et de **dés de Danger (DD)**, tous en d6, lancés ensemble.

1. Le joueur constitue son pool : **1 DA de base** + bonus des Trademarks, Edges et Équipements actifs
2. La situation ou les ennemis imposent des **DD**
3. **Chaque DD annule un DA de valeur égale** (un DD à 5 efface un DA à 5)
4. On lit le **DA le plus haut restant** après annulations

| Résultat | Condition |
|---|---|
| **Boon** *(succès + avantage)* | Plusieurs 6 restants après annulation |
| **Succès** | Meilleur DA restant = 6 |
| **Succès partiel** | Meilleur DA restant = 4 ou 5 |
| **Échec** | Meilleur DA restant = 3 ou moins |
| **Botch** *(désastre)* | Tous les DA annulés, ou seuls des 1 restent |

---

## Fonctionnalités

### Fiche de personnage

**Onglet Trademarks**
- Trademarks activables (clic pour activer / désactiver)
- Jusqu'à 5 Edges par Trademark, activables individuellement quand le Trademark est actif
- Ajout / suppression / édition inline

**Onglet État**
- Hits (3 cases cliquables)
- 6 Conditions (Angry, Dazed, Exhausted, Scared, Restrained, Weakened)
- Stunt Points (3 cases)
- 8 Traumas + 2 Flaws (champs texte)

**Onglet Équipement & XP**
- Gear basique (nom) et spécial (nom + jusqu'à 5 tags activables)
- Stash (5 cases)
- Drive (texte + 9 cases de progression)
- XP (15 cases en 3 groupes)

**Dialog de jet de dés**
- Pré-rempli automatiquement depuis les Trademarks/Edges/Tags actifs
- Chaque case de Trauma non vide ajoute automatiquement 1 DD (affiché séparément)
- Saisie manuelle de DD supplémentaires
- Totaux mis à jour en temps réel
- Résultat posté dans le chat avec dés colorés

### Fiche de PNJ (Menace)

- Tags, Drive, Actions (description des actions disponibles)
- Harm (valeur/max configurable) + Danger Dice pool
- Notes MJ (éditeur ProseMirror)
- Effets actifs

### Items

| Type | Usage | Champs clés |
|---|---|---|
| **Trademark** | Identité du personnage | Nom, 5 Edges activables (pas d'image ni de notes) |
| **Gear** | Équipement | Basique ou Spécial (5 tags activables, pas d'image ni de notes) |
| **Move** | Capacité spéciale | Déclencheur, effet, bonus DA |
| **Contact** | Allié | Loyauté, expertise |
| **Tag** | Descripteur narratif | Type (positif / négatif / neutre) |

---

## Installation

### Via lien symbolique (développement local)

```bash
ln -s /chemin/vers/nco-zal-foundry ~/.local/share/FoundryVTT/Data/systems/neon-city-overdrive
```

### Via copie

Copiez le contenu du repo dans `<FoundryData>/systems/neon-city-overdrive/`, puis redémarrez Foundry et créez un monde avec le système **Neon City Overdrive**.

---

## Structure du projet

```
neon-city-overdrive/
├── system.json
├── template.json
├── module/
│   ├── nco.mjs              # Point d'entrée, hooks, helpers Handlebars
│   ├── documents/           # Classes NCOActor et NCOItem
│   ├── sheets/              # Fiches personnage, PNJ, items (ApplicationV2)
│   ├── apps/                # Dialog de jet de dés
│   └── helpers/             # Dés, config, settings, effets actifs
├── templates/
│   ├── actor/               # Fiches HBS actor + partials
│   ├── item/                # Fiches HBS items
│   ├── dialog/              # Dialog de configuration du jet
│   └── chat/                # Messages de résultat
├── lang/
│   ├── fr.json
│   └── en.json
└── styles/
    └── nco.css
```

---

## Compatibilité

- Foundry VTT **v12+**, vérifié sur **v13**
- Utilise l'API **ApplicationV2** (AppV2)
- Langues : Français · English

---

## Références

- [Neon City Overdrive](https://freeleaguepublishing.com/) — Peter Rudin-Burgess / Free League Publishing
- [Foundry VTT System Development](https://foundryvtt.com/article/system-development/)
