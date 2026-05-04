<template>
	<div class="layout">
		<main class="main">
			<slot />
		</main>
	</div>
</template>

<style scoped>
.layout {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	min-width: 320px;
}

.main {
	flex: 1;
	padding: 1.5rem;
}
</style>
