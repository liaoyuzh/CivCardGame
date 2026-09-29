# Web demo configuration

Edit `demo.json` to select `scene`: `regular` (current game, default) or `tutorial` (historical three-cycle scripted lesson). Vite reloads config edits; deployed builds require rebuilding. These options start a new game, not a saved game.

## Regular game

- `customSetup: null` or omitted uses an explicit 12-card starter deck and berry bush / tribal center. Buildings do not add any cards. Default starting population is 5.
- `setups` holds named configurations. `customSetup` selects one by name; missing names and invalid card/building IDs are rejected. Both `buildings` and `deck` arrays are required and may be empty.
- `deck` entries use `{cardId, count}` with integer counts from 0 to 100. They describe the full active deck, including any research, reform and trade cards you want available.
- A starting building unlocks research candidates, not free cards. Destroying it preserves owned cards.
- Ordinary cards circulate between hand, draw pile and discard pile. Empty draw piles recycle discard cards; this never delays food consumption or grants additional turns.
- End turn discards unused cards and settles food. Food stock is retained. Population zero ends the game. Reset recreates the chosen setup.

## Global balance configuration

Edit `packages/core/src/content/global-config.json`:

| Field | Default | Meaning |
| --- | ---: | --- |
| FoodConsumptionPerPop | 1 | Food per population each turn; ceil the total, then apply demand modifiers |
| BaseHammersPerTurn | 5 | Base labor, independent of population |
| CardsPerTurn | 5 | Base cards drawn each turn |
| StartingFoodTurns | 2 | Initial stock measured in base upkeep turns |
| StartingGold | 3 | Initial trade currency |
| StarvationLossPerMissingFood | 1 | Population lost per missing food |
| PopulationGrowthSurplusRatio | 0.1 | Additional food payment for automatic growth, at least 1; once per turn |
| TradeOfferCount | 5 | Fixed distinct offers per trade action |

FoodConsumptionPerPop and PopulationGrowthSurplusRatio accept finite nonnegative fractions. Other values are finite nonnegative integers; card draw and trade offer counts must be positive.

Growth and starvation defaults are provisional. With food efficiency near 1.5 per hammer, coefficient 1 creates much greater food pressure than the previous three-turn model. No production values were multiplied by three.

The tribal center still controls passive population research via `content/buildings/tribal-center.json`. Its old food ratio applies only to the historical tutorial.

## Shops and card timing

Play research to spend bottles on technologies, unlocked blueprints and action candidates. Play trade to spend gold on foreign cards regardless of local technology. Play barter-goods to earn gold. Purchased cards go to the top of the draw pile immediately; no reform activation is required. Consecutive purchases place the latest card first.

Reform moves cards into reserve without deleting ownership and can restore them to the top of the draw pile. The existing three-choice discovery operation remains available.

## Legacy tutorial

`tutorial` keeps the old scripted cycles, automatic building supply and original balance for regression purposes. It ignores custom setups and does not represent current regular rules. See `docs/brainstorms/014-turn-deckbuilding-implementation.md` for migration scope and remaining design questions.
