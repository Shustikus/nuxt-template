<template>
	<section class="old-browser-page">
		<header class="old-browser-page__header">
			<NuxtLink
				class="old-browser-page__logo-link"
				to="/"
				aria-label="На главную"
			>
				<span class="old-browser-page__logo-text">Nuxt Template</span>
			</NuxtLink>

			<div class="old-browser-page__contacts">
				<a href="mailto:support@example.com">support@example.com</a>
			</div>
		</header>

		<div class="old-browser-page__content-wrap">
			<div class="old-browser-page__content">
				<h1>Ваш браузер не поддерживается</h1>
				<p>
					Вы используете устаревший браузер, который не поддерживает современные веб-стандарты и может угрожать
					безопасности ваших данных. Пожалуйста, установите любой современный браузер.
				</p>

				<ul
					class="old-browser-page__browser-list"
					aria-label="Современные браузеры"
				>
					<li
						v-for="browser in browsers"
						:key="browser.name"
					>
						<a
							:href="browser.href"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Icon
								:name="browser.icon"
								size="64"
								aria-hidden="true"
							/>
							<span>{{ browser.name }}</span>
						</a>
					</li>
				</ul>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
definePageMeta({ name: "old-browser", layout: false });

useSeoMeta({ title: "Устаревший браузер", robots: "noindex,nofollow" });

useHead({ titleTemplate: "%s" });

const browsers = [
	{ name: "Google Chrome", href: "https://www.google.com/intl/ru/chrome/", icon: "mdi:google-chrome" },
	{ name: "Mozilla Firefox", href: "https://www.mozilla.org/ru/firefox/new/", icon: "mdi:firefox" },
	{ name: "Яндекс Браузер", href: "https://browser.yandex.ru/", icon: "mdi:compass" },
	{ name: "Opera", href: "https://www.opera.com/ru", icon: "mdi:opera" },
] as const;
</script>

<style scoped>
.old-browser-page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background: #ffffff;
	color: #1a222c;
}

.old-browser-page__header {
	width: 100%;
	max-width: 1520px;
	min-height: 95px;
	margin: 0 auto;
	padding: 20px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24px;
}

.old-browser-page__logo-link {
	display: inline-flex;
	flex: 0 0 auto;
	text-decoration: none;
}

.old-browser-page__logo-text {
	font-size: 22px;
	font-weight: 700;
	color: #1a222c;
}

.old-browser-page__contacts {
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-end;
	gap: 23px;
}

.old-browser-page__contacts a {
	color: #1a222c;
	font-size: 16px;
	font-weight: 700;
	line-height: 19px;
	text-decoration: none;
}

.old-browser-page__content-wrap {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40px 20px 95px;
}

.old-browser-page__content {
	width: 100%;
	max-width: 849px;
	text-align: center;
}

.old-browser-page__content h1 {
	margin: 0;
	color: #1a222c;
	font-size: 24px;
	font-weight: 700;
	line-height: 1.21;
}

.old-browser-page__content > p {
	margin: 20px 0 0;
	color: #5b6169;
	font-size: 16px;
	line-height: 1.5;
}

.old-browser-page__browser-list {
	list-style: none;
	margin: 48px 0 0;
	padding: 0;
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 32px;
}

.old-browser-page__browser-list li {
	display: flex;
}

.old-browser-page__browser-list a {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	text-decoration: none;
	color: #1a222c;
	font-size: 15px;
	font-weight: 500;
	transition: transform 0.2s ease;
}

.old-browser-page__browser-list a:hover {
	transform: translateY(-2px);
}
</style>
