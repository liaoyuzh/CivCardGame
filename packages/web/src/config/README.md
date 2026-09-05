# Web demo configuration

Edit `demo.json` to select `scene`: `regular` (default) or `tutorial`. Vite reloads edits during development; rebuild for deployment. This config selects a new game, not a saved game.

- `tutorial`: the existing three-cycle scripted lesson; ignores `customSetup`.
- `regular`: starts at cycle one with active buildings, research and reform, without tutorial crisis triggers or a three-cycle limit.
- `customSetup: null` or omitted: berry bush (40 uses, 9 actions/cycle), fully active tribe center, one permanent search card, 5 population. The center grants its initial 6 research once.
- `setups` stores named setups, including unused ones. `customSetup` selects a key from this registry; a missing key is an error. Only the selected setup is validated and used. Set `customSetup` to null to keep definitions for later while using defaults.
- A custom setup replaces the defaults entirely. Both arrays are required; empty arrays are allowed. Duplicate building IDs and unknown content IDs are rejected.

Example:

```json
{
  "scene": "regular",
  "customSetup": "research-start",
  "setups": {
    "research-start": {
      "buildings": [
        "berry-bush",
        "tribal-center"
      ],
      "deck": [
        {
          "cardId": "search-food",
          "count": 2
        }
      ]
    },
    "minimal": {
      "buildings": [
        "berry-bush"
      ],
      "deck": [
        {
          "cardId": "search-food",
          "count": 1
        }
      ]
    }
  }
}
```

Supported buildings: `berry-bush`, `tribal-center`. Deck IDs come from core `content/cards.json`: `search-food`, `gather-berries`, `research`, `reform`. Counts are integers 0–100 per entry. Deck entries are permanent cards; building-generated cards are added separately every cycle and are not listed here. Do not repeat building-provided cards in the setup deck: tribal-center supplies research ×1 and reform ×1, and berry-bush supplies gather-berries ×9. The example lists only search-food ×2, for 13 cards per cycle in total. Explicit deck entries create additional permanent copies, so they should only be used when that is intentional.

Regular decks shuffle reproducibly each cycle. End turn can discard unplayed cards, allowing custom hands that exceed available labor. Reset recreates the selected setup. Research works from cycle one and the center is not re-granted on cycle three.

Current prototype limits: regular search uses the existing benign stored-nuts event until a balanced regular event pool is designed. Regular mode has no automatic ending: insufficient food consumes the available food, reports a shortage, and leaves population unchanged so the next cycle can start. Exhausted buildings and empty decks do not end the game. Tutorial still requires its scripted supply target and ends after three cycles. Without a center, no center effects run: no research income, food settlement, or population growth; food is still cleared between cycles. Building construction and crisis/cohesion progression remain future work.
