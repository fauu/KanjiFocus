<!-- vim: set textwidth=80 colorcolumn=80: -->
<!-- markdownlint-configure-file
{
  "line-length": { "code_blocks": false },
  "no-inline-html": false
}
-->
# KanjiFocus

An <ins>abandoned prototype</ins> of a browser extension that fetches kanji familiar
to the user from Anki and highlights those kanji on websites.

The hypothesized benefits of the highlighting for beginner Japanese learners:

* Helps one orient oneself in a relatively difficult text and find entry points
  from which to begin digesting each sentence—promotes early immersion and makes
  the challenging texts slightly more comprehensible.

* Encourages putting effort into recalling possibly familiar words over skipping
  straight to a dictionary lookup or wasting too much effort on failed recall
  attempts—promotes economical vocabulary acquisition.

## Notes

* Provided as is: the addon is not available in a user-friendly form, because it
never reached that development stage.

* Works properly only in Firefox.

* No configuration interface: Anki deck name, word field name, kanji highlight
  styling are all hardcoded in `src/entries/background/main.ts`.

## Running

### Setup & build

```sh
cd KanjiFocus
pnpm install
pnpm build
```

### Option 1: Run with hot-reload through `web-ext`

```sh
pnpm serve:firefox
```

### Option 2: Load manually

1. In Firefox, navigate to `about:debugging`.

1. Click `This Firefox`.

1. Click `Load Temporary Add-on`.

1. Select `KanjiFocus/dist/manifest.json`.

## Usage

1. Navigate to a website with Japanese text.

1. Open the addon from the Extensions menu.

1. Click `Fetch familiar kanji…`.

    Note that for this to work, Anki must be running along with the AnkiConnect addon
    and the variables `DECK_NAME` and `FIELD_NAME` in `src/entries/background/main.ts`
    must be set according to the name of your Japanese vocabulary deck and the name
    of the note field containing the Japanese word.

1. Click `Higlight familiar kanji…`.

## License

KanjiFocus\
Copyright (C) 2022–2023 Piotr Grabowski

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option) any
later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program. If not, see <https://www.gnu.org/licenses/>.
