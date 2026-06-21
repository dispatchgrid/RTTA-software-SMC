// supabase-sql.js
class SupabaseSQL {
    constructor(url, anonKey) {
        this.client = window.supabase.createClient(url, anonKey);
    }

    async run(query) {
        if (!query || typeof query !== 'string') {
            throw new Error('Query must be a non-empty string');
        }

        const { data, error } = await this.client.rpc('execute_raw_sql', { query });

        if (error) {
            console.error('SQL Error:', error.message);
            return { error: error.message };
        }

        return { data };
    }
}
