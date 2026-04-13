# Neon City Overdrive — FoundryVTT System

![Foundry v12+](https://img.shields.io/badge/foundry-v12%2B-green)
![Verified v13](https://img.shields.io/badge/verified-v13-brightgreen)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Langues](https://img.shields.io/badge/langues-FR%20%7C%20EN-lightgrey)

Système FoundryVTT non officiel pour **Neon City Overdrive** (Peter Rudin-Burgess / Free League Publishing), avec support intégré du cadre **Zalozhniy Quartet** (espionnage / horreur cosmique).

---

## Mécanique centrale

NCO repose sur un pool de **dés d'Action (DA)** contre des **dés de Danger (DD)**, tous en d6.

1. Le joueur constitue son pool : **1 DA de base** + bonus des Trademarks, Edges et Équipements actifs
2. La situation ou les ennemis imposent des **DD**
3. On compare le **meilleur DA** au **meilleur DD**

| Résultat | Condition |
|---|---|
| **Succès critique** | Meilleur DA = 6 et DA > DD |
| **Succès solide** | Meilleur DA = 5 et DA > DD |
| **Succès** | Meilleur DA = 4 et DA > DD |
| **Succès partiel** | Meilleur DA = 3 et DA > DD, ou DA = DD |
| **Échec** | DA < DD ou DA ≤ 2 |
| **Désespéré** | 0 DA — on lance 2 DD et on prend le plus bas |

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
- Saisie manuelle des DD
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
| **Trademark** | Identité du personnage | Nom, 5 Edges activables |
| **Gear** | Équipement | Basique ou Spécial (5 tags activables) |
| **Move** | Capacité spéciale | Déclencheur, effet, bonus DA |
| **Contact** | Allié | Loyauté, expertise |
| **Tag** | Descripteur narratif | Type (positif / négatif / neutre) |
| **Asset** *(Zalozhniy)* | Ressource d'agent | Type, fiabilité, état "grillé" |
| **Threat** *(Zalozhniy)* | Antagoniste structuré | Pool DD, seuil d'exposition |

---

## Mode Zalozhniy Quartet

Activez dans **Paramètres → Système → Mode de jeu** pour les règles espionnage / horreur :

- **Assets** : ressources humaines, techniques, financières ou informationnelles — avec état "grillé"
- **Threats** : antagonistes avec pool de DD dédié et seuil d'exposition
- **Sanité** *(optionnelle)* : activable séparément dans les paramètres

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
- [Zalozhniy Quartet](https://freeleaguepublishing.com/) — Free League Publishing
- [Foundry VTT System Development](https://foundryvtt.com/article/system-development/)
