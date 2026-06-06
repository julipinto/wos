<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SlotLadder from '$lib/tools/upgrade/SlotLadder.svelte';
  import {
    CHARM_PIECES,
    CHARM_SLOTS_PER_PIECE,
    CHARM_LADDER
  } from '$lib/tools/upgrade/data/charms';

  // 6 gear pieces × 3 charm slots = 18 slots.
  const slots = CHARM_PIECES.flatMap((p) =>
    Array.from({ length: CHARM_SLOTS_PER_PIECE }, (_, n) => ({
      id: `${p.id}_${n + 1}`,
      name: `${p.name} · ${n + 1}`
    }))
  );
</script>

<svelte:head>
  <title>{i18n.m.upgrade.cat.charms} · {i18n.m.upgrade.title}</title>
</svelte:head>

<div class="wrap">
  <PageHeader
    title={i18n.m.upgrade.cat.charms}
    sub={i18n.m.upgrade.charms.sub}
    backHref="/upgrade"
  />
  <SlotLadder ladder={CHARM_LADDER} {slots} storageKey="upgrade-charms-v1" />
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
