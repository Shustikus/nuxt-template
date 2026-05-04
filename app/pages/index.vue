<template>
	<div>
		<h1>Nuxt template</h1>
		<p>
			Стартовая страница — добавьте маршруты в
			<code>app/config/routes.ts</code> и страницы в <code>app/pages/</code>.
		</p>
		<p
			v-if="siteUrl"
			class="meta"
		>
			<code>NUXT_PUBLIC_SITE_URL</code>: {{ siteUrl }}
		</p>
	</div>
</template>

<script setup lang="ts">
definePageMeta({ name: "home" });

const config = useRuntimeConfig();
const siteUrl = computed(() => config.public.siteUrl);

useSeoMeta({
	title: "Главная",
	description: "Nuxt template",
	...(config.public.siteUrl ? { ogUrl: config.public.siteUrl } : {}),
});
</script>

<style scoped>
.meta {
	margin-top: 1rem;
	font-size: 0.9rem;
	color: #555;
}
</style>
