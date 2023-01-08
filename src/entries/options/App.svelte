<script lang="ts">
  import { acCanConnect } from "~/common/ankiConnect";

  const acAvailable = acCanConnect();
</script>

<main>
  {#await acAvailable}
    Connecting to Anki…
  {:then isAvailable}
    {#if isAvailable}
      Connected to Anki.
    {:else}
      Could not connect to Anki.
    {/if}
  {/await}
</main>

<style>
</style>
