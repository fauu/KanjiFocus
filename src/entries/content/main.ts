import { FAMILIAR_CLASS_NAME } from "~/common/css";
import { listenForKFMessageForContent } from "~/common/KFMessage";

const GROUP_FAMILIAR = false;
const TRAVERSE_EXCLUDE_TAG_NAMES = ["SCRIPT", "STYLE", "IFRAME", "CANVAS"];

const KAMITE_HOST = "localhost:4110";

let allKanjiRe: RegExp;
let familiarKanjiRe: RegExp;

listenForKFMessageForContent(msg => {
  if (msg.kind === "kf-content-run") {
    allKanjiRe = msg.allKanjiRe;
    familiarKanjiRe = msg.familiarKanjiRe;
    main();
  }
});

function main() {
  if (document.location.host === KAMITE_HOST) {
    // XXX: Provisional. If generalized, could support all webpages with dynamically loaded text
    const chunkLabelEl = document.getElementById("chunk-label");
    traverse(chunkLabelEl);
    const observer = new MutationObserver(_mutations => traverse(chunkLabelEl));
    observer.observe(chunkLabelEl, { childList: true });
  } else {
    const bodyEl = document.getElementsByTagName("body")[0];
    console.time("highlight")
    traverse(bodyEl);
    console.timeEnd("highlight")
  }
}

function traverse(node: Node) {
  if (!node) {
    return;
  }
  let currChild = node.firstChild;
  while (currChild) {
    switch (currChild.nodeType) {
      case 1: // Tag
        if (TRAVERSE_EXCLUDE_TAG_NAMES.includes((currChild as Element).tagName)) {
          break;
        }
        if ((currChild as Element).classList.contains(FAMILIAR_CLASS_NAME)) {
          break;
        }
        traverse(currChild);
        break;

      case 3: // Text node
        allKanjiRe.lastIndex = 0;
        let anyKanjiStrMatch: RegExpExecArray;
        while (anyKanjiStrMatch = allKanjiRe.exec(currChild.nodeValue)) {
          const familiarKanjiStrMatch = anyKanjiStrMatch[0].match(familiarKanjiRe);
          if (!familiarKanjiStrMatch) {
            continue;
          }

          const parent = currChild.parentNode as HTMLElement;
          if (
            parent.childNodes.length === 1
            && parent.tagName === "SPAN"
            && parent.style.display === ""
            && currChild.textContent.length === familiarKanjiStrMatch[0].length
          ) {
            parent.classList.add(FAMILIAR_CLASS_NAME);
            break;
          }

          const rest = (currChild as Text).splitText(
            anyKanjiStrMatch.index + familiarKanjiStrMatch.index
          );

          if (GROUP_FAMILIAR) {
            const newEl = document.createElement("span");
            newEl.className = `${FAMILIAR_CLASS_NAME} kf-familiar-grouped`;
            newEl.textContent = familiarKanjiStrMatch[0];
            parent.insertBefore(newEl, rest);
          } else {
            for (const ch of familiarKanjiStrMatch[0]) {
              const newEl = document.createElement("span");
              newEl.className = `${FAMILIAR_CLASS_NAME} kf-familiar-ungrouped`;
              newEl.textContent = ch;
              parent.insertBefore(newEl, rest);
            }
          }

          rest.textContent = rest.textContent.slice(familiarKanjiStrMatch[0].length);

          currChild = currChild.nextSibling;

          break;
        }
        break;
    }
    currChild = currChild.nextSibling;
  }
}
