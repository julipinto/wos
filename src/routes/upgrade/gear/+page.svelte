<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SlotLadder from '$lib/tools/upgrade/SlotLadder.svelte';
  import { GEAR_PIECES, GEAR_LADDER } from '$lib/tools/upgrade/data/gear';

  const slots = GEAR_PIECES.map((p) => ({ id: p.id, name: p.name }));
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.gear} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader title={i18n.m.upgrade.cat.gear} sub={i18n.m.upgrade.gear.sub} backHref="/upgrade" />
  <SlotLadder ladder={GEAR_LADDER} {slots} storageKey="upgrade-gear-v1" />
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
  }
</style>
