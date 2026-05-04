import type { Meta, StoryObj } from "@storybook/vue3-vite";

const meta = { title: "Введение/Welcome", tags: ["autodocs"] } satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => ({
		template: "<p>Storybook подключён. Добавляйте сторис рядом с компонентами в <code>app/docs/</code>.</p>",
	}),
};
