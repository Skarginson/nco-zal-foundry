# Neon City Overdrive — FoundryVTT System

![Foundry v11](https://img.shields.io/badge/foundry-v11-green)
![Foundry v12](https://img.shields.io/badge/foundry-v12-green)
![Version](https://img.shields.io/badge/version-0.1.0-blue)

Système FoundryVTT pour **Neon City Overdrive** (Peter Rudin-Burgess / Free League Publishing), avec support intégré du cadre **Zalozhniy Quartet** (espionnage / horreur cosmique).

---

## Mécanique centrale

NCO repose sur un pool de **dés d'Action (DA)** contre des **dés de Danger (DD)**, tous en d6.

1. Le joueur lance ses DA, la situation impose des DD
2. On compare le **meilleur DA** au **meilleur DD**
3. Le résultat dépend de la valeur du meilleur DA et de la comparaison :

| Résultat | Condition |
|---|---|
| **Succès critique** | DA = 6 et DA > DD |
| **Succès solide** | DA = 5 et DA > DD |
| **Succès** | DA = 4 et DA > DD |
| **Succès partiel** | DA = 3 et DA > DD, ou DA = DD |
| **Échec** | DA < DD, ou DA ≤ 2 |
| **Désespéré** | 0 DA — on lance 2 DD et on garde le plus bas |

---

## Fonctionnalités

### Fiches de personnage
- 4 traits (Body / Reflex / Mind / Presence) avec valeur en dés
- Jauges Stress (0–8), Blessures (0–4), Crédit
- Onglets : Principal · Identité · Équipement · Effets

### Fiches PNJ
- Pool de dés fixes (DA / DD)
- Jauge de Blessures configurable
- Notes MJ

### Items
| Type | Description |
|---|---|
| **Gear** | Équipement avec bonus en DA et coût en Crédit |
| **Move** | Capacité spéciale avec déclencheur et effet |
| **Contact** | Allié avec expertise et loyauté |
| **Tag** | Descripteur narratif (positif / négatif / neutre) |

### Lancer de dés
- Clic sur un trait → dialog de configuration
- Saisie du bonus équipement, aide alliée (+1 DA), dés de danger
- Totaux mis à jour en temps réel
- Message de chat avec les dés colorés (meilleur dé mis en évidence) et badge de résultat

---

## Zalozhniy Quartet

Activez le mode Zalozhniy dans **Paramètres → Système** pour accéder aux règles d'espionnage / horreur :

**Modifications :**
- Renommage des traits (Physique / Terrain / Analyse / Couverture)
- **Couverture** : trait 1–4 représentant la solidité de la légende du personnage
- **Sanité** : jauge 0–6 (activable séparément)
- **Exposition** : track de mission 0–5, cliquable directement sur la fiche

**Nouveaux types d'items :**
- **Asset** (Ressource) : humain / technique / financier / information — avec fiabilité et état "grillé"
- **Threat** (Menace) : antagoniste structuré avec pool DD et seuil d'exposition

---

## Installation

### Via lien symbolique (développement)

```bash
ln -s /chemin/vers/nco-zal-foundry ~/.local/share/FoundryVTT/Data/systems/neon-city-overdrive
```

### Via téléchargement

Copiez le contenu du repo dans :
```
<FoundryData>/systems/neon-city-overdrive/
```

Puis redémarrez Foundry et créez un monde avec le système **Neon City Overdrive**.

---

## Structure du projet

```
neon-city-overdrive/
├── system.json
├── template.json
├── module/
│   ├── nco.mjs                  # Point d'entrée
│   ├── documents/               # Classes Actor et Item
│   ├── sheets/                  # Feuilles de personnage
│   ├── helpers/                 # Dés, config, settings, effets
│   └── apps/                    # Dialog de jet de dés
├── templates/
│   ├── actor/                   # Fiches HBS
│   ├── item/                    # Fiches items
│   ├── dialog/                  # Dialog de configuration
│   └── chat/                    # Messages de résultat
├── lang/
│   ├── en.json
│   └── fr.json
└── styles/
    └── nco.css
```

---

## Compatibilité

- Foundry VTT v11 et v12
- Langues : Français · English

---

## Références

- [Neon City Overdrive](https://freeleaguepublishing.com/) — Peter Rudin-Burgess / Free League Publishing
- [Foundry VTT System Development](https://foundryvtt.com/article/system-development/)
- [Foundry API](https://foundryvtt.com/api/)
