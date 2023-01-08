import browser from "webextension-polyfill";

import type { FamiliarKanjiFetchStatus } from "./FamiliarKanjiFetchStatus";

export type KFMessage = KFMessageRuntime | KFMessageTabs;

export type KFMessageRuntime = KFMessageForBackground | KFMessageForPopup;

export type KFMessageTabs = KFMessageForContent;

export type KFMessageForBackground =
  | { kind: "kf-get-familiar-kanji-fetch-status" }
  | { kind: "kf-highlight" }
  | { kind: "kf-fetch" };

export type KFMessageForPopup =
  | { kind: "kf-familiar-kanji-fetch-status", status: FamiliarKanjiFetchStatus };

export type KFMessageForContent =
  | { kind: "kf-content-run", allKanjiRe: RegExp, familiarKanjiRe: RegExp };

export function sendKFMessageRuntime(msg: KFMessageRuntime): Promise<any> {
  return browser.runtime.sendMessage(msg);
}

export function sendKFMessageTabs(tabId: number, msg: KFMessageTabs): Promise<any> {
  return browser.tabs.sendMessage(tabId, msg);
}

function listenForKFMessage(cb: (msg: KFMessage) => void) {
  browser.runtime.onMessage.addListener(cb);
}

export function listenForKFMessageForPopup(cb: (msg: KFMessageForPopup) => void) {
  listenForKFMessage(cb);
}

export function listenForKFMessageForBackground(cb: (msg: KFMessageForBackground) => void) {
  listenForKFMessage(cb);
}

export function listenForKFMessageForContent(cb: (msg: KFMessageForContent) => void) {
  listenForKFMessage(cb);
}
