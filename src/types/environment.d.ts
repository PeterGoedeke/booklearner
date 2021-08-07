declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV?: 'development' | 'staging' | 'production'
            DATABASE_URI?: string
            PORT?: string
        }
    }
}

export {}