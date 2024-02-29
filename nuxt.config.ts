const isDev = process.env.MODE;

export default defineNuxtConfig({
    ssr: true,

    app: {
        head: {
            title: 'Box Randomizer'
        },
        ...(isDev ? {} : { baseURL: '/nuxt-box-randomizer/' })
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
