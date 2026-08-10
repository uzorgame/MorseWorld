# Sources

Every code table in `src/core/tables/` and every text in `src/content/texts.ts`
must have an entry here. This is a matter of trust in the tool, not paperwork:
a project whose main promise is accuracy cannot ship codes it made up.

Status legend: ✅ verified against the source · ⚠️ implemented, source not
pinned down yet · ❗ implemented but **not verified**, deliberately withheld
from the interface.

## Code tables

| id | Name | Source | Status |
| --- | --- | --- | --- |
| `international` | ITU-R M.1677-1 | Recommendation ITU-R M.1677-1 (10/2009), "International Morse code" | ⚠️ link to the recommendation still to be added |
| `cyrillic` | Cyrillic (base) | — | ⚠️ implemented, source not pinned down |
| `cyrillic-ua` | Ukrainian | — | ❗ implemented from the most widespread variant, **not verified**, not offered in the UI |

### What must be checked before v1

**The Ukrainian table.** The code currently holds the most widespread variant:
`І` takes `..`, `И` moves to `-.--`, and `Ї` (`.---.`), `Є` (`..-..`) and `Ґ`
(`--.`, same as `Г`) are added. A **second variant** exists that differs on
several letters. Both should be:

1. found in a primary source, not in a retelling;
2. added as separate tables with an explicit switch;
3. accompanied by a note on exactly how they differ.

Until that is done the table stays out of the table switch — see
`UNVERIFIED_TABLE_IDS` in `src/core/tables/index.ts`. It is still reachable in
code, so nothing is lost by waiting.

**The base Cyrillic table.** Well established in itself, but a citation is
needed all the same.

## Reading texts

Public domain only: the author died more than seventy years ago. Each text
carries its source and licence. The collection lives in `src/content/texts.ts`
as a static module — nothing is fetched at runtime.

| id | Work | Author | Source | Status |
| --- | --- | --- | --- | --- |
| `alice-opening` | Alice's Adventures in Wonderland (1865) | Lewis Carroll | Project Gutenberg #11 | ⚠️ wording and link to be checked |
| `pride-opening` | Pride and Prejudice (1813) | Jane Austen | Project Gutenberg #1342 | ⚠️ wording and link to be checked |
| `moby-opening` | Moby-Dick (1851) | Herman Melville | Project Gutenberg #2701 | ⚠️ wording and link to be checked |

**What exactly to check.** The excerpts were entered from memory and must be
compared word for word against the text on Project Gutenberg, and the ebook
numbers opened and confirmed. Until that is done the collection is deliberately
short: three verified excerpts are worth more than thirty paraphrased ones.

**This is currently the only place in the project that quotes from recall.**
Everything else — every code, every threshold — comes from a table or a formula.

**Ukrainian texts** are out of scope for now. Lessons and reading both run on
the international table only (see below), and the base Cyrillic table has no
`І`, `Ї`, `Є`, `Ґ` — without which a Ukrainian word cannot be transmitted.
Should they be added later, the source would be Чтиво.

## Decisions on record

**Table detection is impossible.** Latin and Cyrillic overlap heavily by code:
`.-` is both `A` and `А`. The table is therefore always chosen explicitly. The
choice is **not** persisted between visits — every load starts on the
international table, because Cyrillic is the secondary table and a stale choice
used to open the site in a mode where half the features decline to work. It can
still be passed in the address as `?table=`.

In the translator the *direction* is detected automatically (morse pasted into
the text field is a request to decode, and a letter in the code field means the
person switched to words), but never the table.

**Lessons and reading are international-table only.** Koch's ordering is not an
alphabet: adjacent characters are deliberately contrasting by ear and frequent
letters come first. A standard order exists for Latin only, and translating it
mechanically onto another alphabet produces a sequence that confuses rather than
teaches. Deriving a Cyrillic order was considered and dropped — the lessons show
no table switch at all, and both pages read the international table directly
rather than the global selection, so a choice made elsewhere cannot strand them.

**Formula sources.** Dot length is `1200 / WPM` ms. Farnsworth spacing uses the
ARRL formula (`src/core/timing.ts`), which stretches inter-character and
inter-word gaps only, never the gaps inside a character. Speed in words per
minute is measured against PARIS — 50 units per word.
