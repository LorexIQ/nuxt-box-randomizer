// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    ssr: false,

    app: {
        head: {
            title: 'Box Randomizer'
        }
    },

    css: [
        '~/assets/styles/main.scss',
        '~/assets/styles/transitions.scss'
    ],

    modules: [
        '@pinia/nuxt',
    ],

    pinia: {
        storesDirs: ['./stores/**'],
    },

    devtools: {enabled: true}
})
