import browser from "webextension-polyfill";

import { acFetch } from "~/common/ankiConnect";
import { FAMILIAR_CLASS_NAME } from "~/common/css";
import type { FamiliarKanjiFetchStatus } from "~/common/FamiliarKanjiFetchStatus";
import {
  listenForKFMessageForBackground, sendKFMessageRuntime, sendKFMessageTabs
} from "~/common/KFMessage";

// XXX: Into config
const INCLUDE_SUSPENDED = false;
const DECK_NAME = "Japanese VOCABULARY";
const FIELD_NAME = "Word";

const ALL_KANJI_RE_SINGLE = /[\u3400-\u4DB5\u4E00-\u9FCB\uF900-\uFA6A]/g;
const ALL_KANJI_RE = /[\u3400-\u4DB5\u4E00-\u9FCB\uF900-\uFA6A]+/g;
const FAMILIAR_KANJI_RE_STORAGE_KEY = "familiarKanjiRe";

let familiarKanjiFetchStatus: FamiliarKanjiFetchStatus = { kind: "not-fetched" };
let familiarKanjiRe: RegExp | undefined;

async function fetchFamiliarKanji(): Promise<Set<string>> {
  const kanji = new Set<string>();

  const cardIds: number[] = await acFetch("findCards", { query: `deck:"${DECK_NAME}"` });
  console.debug("Fetched", cardIds.length, "card IDs");
  const cardInfos: unknown[] = await acFetch("cardsInfo", { cards: cardIds });
  console.debug("Fetched", cardInfos.length, "card infos");

  const noteIds = [];
  cardInfos.forEach(info => {
    const q: number = info["queue"];
    if (q !== 0 && (INCLUDE_SUSPENDED || q !== -1)) {
      const note: number = info["note"];
      note && noteIds.push(note);
    }
  });

  const noteInfos: unknown[] = await acFetch("notesInfo", { notes: noteIds });
  console.debug("Fetched", noteInfos.length, "note infos");
  noteInfos.forEach(info => {
    const fields: {} = info["fields"];
    if (!fields) {
      return;
    }
    const wordField: {} | undefined = fields[FIELD_NAME];
    if (!wordField) {
      return;
    }
    const word: string | undefined = wordField["value"];
    if (!word) {
      return;
    }
    for (const match of word.matchAll(ALL_KANJI_RE_SINGLE)) {
      kanji.add(match[0]);
    }
  });

  console.debug("Got", kanji.size, "unique kanji");

  return kanji;
}

function sendFamiliarKanjiFetchStatus() {
  sendKFMessageRuntime({ kind: "kf-familiar-kanji-fetch-status", status: familiarKanjiFetchStatus });
}

function updateFamilarKanjiFetchStatus(status: FamiliarKanjiFetchStatus) {
  familiarKanjiFetchStatus = status;
  sendFamiliarKanjiFetchStatus();
}

async function loadFamiliarKanjiRe(): Promise<RegExp | undefined> {
  try {
    const res = await browser.storage.local.get(FAMILIAR_KANJI_RE_STORAGE_KEY);
    return res[FAMILIAR_KANJI_RE_STORAGE_KEY];
  } catch (e) {
    console.error("Error while trying to load familiar kanji regex from storage");
  }
}

async function storeFamiliarKanjiRe(re: RegExp): Promise<void> {
  try {
    await browser.storage.local.set({ [FAMILIAR_KANJI_RE_STORAGE_KEY]: re });
    console.debug("Stored familiar kanji regex");
  } catch (e) {
    console.error("Could not store familiar kanji regex");
  }
}

function handleFamiliarKanjiFetchStatusRequest() {
  sendFamiliarKanjiFetchStatus();
}

async function handleHighlightRequest(): Promise<void> {
  if (!familiarKanjiRe) {
    console.error("Received highlight request but familiar kanji were not fetched");
    return;
  }

  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  await browser.tabs.executeScript(tab.id, { file: "src/entries/content/main.js" });
  void sendKFMessageTabs(
    tab.id,
    { kind: "kf-content-run", allKanjiRe: ALL_KANJI_RE, familiarKanjiRe }
  );

  let css: string;
  // XXX: Provisional
  if (tab.title === "Kamite") {
    css = `#chunk-label .${FAMILIAR_CLASS_NAME} {
  background-image: linear-gradient(0deg, rgba(255, 255, 255, 0.3) 0%, rgba(0, 0, 0, 0) 100%);
}`;
  } else {
    css = `.kf-familiar-ungrouped {
  border-top: 1px solid purple;
  border-radius: 6px;
}
.kf-familiar-grouped {
  background: rgba(0, 0, 0, 0.1);
}`;
  }
  void browser.tabs.insertCSS(tab.id, { code: css });
}

async function handleFetchRequest(): Promise<void> {
  const initialStatus = familiarKanjiFetchStatus;

  updateFamilarKanjiFetchStatus({ kind: "fetching" });

  let familiarKanji: Set<string> | undefined;
  try {
    familiarKanji = await fetchFamiliarKanji();
  } catch (e) {
    updateFamilarKanjiFetchStatus({...initialStatus, previousFetchError: e});
    return;
  }

  const familiarKanjiStr = Array.from(familiarKanji).join("");
  familiarKanjiRe = new RegExp(`[${familiarKanjiStr}]+`);

  updateFamilarKanjiFetchStatus({ kind: "fetched", date: new Date(), size: familiarKanji.size });
  storeFamiliarKanjiRe(familiarKanjiRe);
}

function initMessageHandlers() {
  listenForKFMessageForBackground(async msg => {
    switch (msg.kind) {
      case "kf-get-familiar-kanji-fetch-status":
        void handleFamiliarKanjiFetchStatusRequest();
        break;
      case "kf-highlight":
        void handleHighlightRequest();
        break;
      case "kf-fetch":
        void handleFetchRequest();
        break;
    }
  });
}

async function main() {
  familiarKanjiRe = await loadFamiliarKanjiRe();

  initMessageHandlers();
}

browser.runtime.onInstalled.addListener(() => {
  void main();
});
