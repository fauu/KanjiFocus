<script lang="ts">
  import { runtime } from "webextension-polyfill";

  import type { FamiliarKanjiFetchStatus } from "~/common/FamiliarKanjiFetchStatus";
  import { listenForKFMessageForPopup, sendKFMessageRuntime } from "~/common/KFMessage";

  const MS_IN_SECOND = 1000;
  const SECS_IN_MIN = 60;
  const SECS_IN_HOUR = SECS_IN_MIN * 60;
  const SECS_IN_DAY = SECS_IN_HOUR * 24;
  const SECS_IN_MONTH = SECS_IN_DAY * 30.5;
  const SECS_IN_YEAR = SECS_IN_MONTH * 12;
  const timeDeltaBrackets: [number, Intl.RelativeTimeFormatUnit | undefined][] = [
    [SECS_IN_MIN, "minutes"],
    [SECS_IN_HOUR, "hours"],
    [SECS_IN_DAY, "days"],
    [SECS_IN_MONTH, "months"],
    [SECS_IN_YEAR, "years"],
    [Infinity, undefined]
  ];

  const fetchDateRelativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  let familiarKanjiFetchStatus: FamiliarKanjiFetchStatus | undefined;

  function humanizeFetchDate(date: Date): string {
    const deltaS = Math.round((Date.now() / MS_IN_SECOND) - (date.getTime() / MS_IN_SECOND));
    if (deltaS < SECS_IN_MIN) {
      return "just now";
    } else {
      for (let i = 1; i < timeDeltaBrackets.length; i++) {
        const maxForPrevBracket = timeDeltaBrackets[i][0];
        if (deltaS < maxForPrevBracket) {
          const bracket = timeDeltaBrackets[i - 1];
          return fetchDateRelativeFormat.format(Math.floor(-deltaS / bracket[0]), bracket[1]);
        }
      }
    }
  }

  function handleHighlightClick() {
    sendKFMessageRuntime({ kind: "kf-highlight" });
  }

  function handleFetchClick() {
    sendKFMessageRuntime({ kind: "kf-fetch" });
  }

  function handleSettingsClick() {
    runtime.openOptionsPage();
  }

  function init() {
    sendKFMessageRuntime({ kind: "kf-get-familiar-kanji-fetch-status" });
    familiarKanjiFetchStatus = { kind: "fetching" };

    listenForKFMessageForPopup(msg => {
      familiarKanjiFetchStatus = msg.status;
    });
  }

  init();
</script>

<main>
  {#if familiarKanjiFetchStatus.kind === "fetching"}
    Fetching familiar kanji from Anki…
  {:else}
    {#if familiarKanjiFetchStatus.kind === "not-fetched"}
      Have no familiar kanji in the database.<br>
    {:else if familiarKanjiFetchStatus.kind === "fetched"}
      <button on:click={handleHighlightClick}>Highlight familiar kanji on the current page</button><br><br>
      Familiar kanji in the database: {familiarKanjiFetchStatus.size}.<br>
      Last fetched {humanizeFetchDate(familiarKanjiFetchStatus.date)}.<br>
    {/if}
    {#if familiarKanjiFetchStatus.previousFetchError}
      Last fetch attempt failed.<br>
    {/if}
    <button on:click={handleFetchClick}>Fetch familiar kanji from Anki</button>
  {/if}
  <button on:click={handleSettingsClick}>Settings</button>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
  }
</style>
