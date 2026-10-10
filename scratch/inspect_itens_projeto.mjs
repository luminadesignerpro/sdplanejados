import pg from 'pg';

const stringsToTry = [
    "postgresql://postgres.nglwscakhhdhelhbqkyb:nglwscakhhdhelhbqkyb@aws-0-sa-east-1.pooler.supabase.com:6543/postgres",
    "postgresql://postgres.nglwscakhhdhelhbqkyb:nglwscakhhdhelhbqkyb@aws-0-sa-east-1.pooler.supabase.com:5432/postgres",
    "postgresql://postgres:nglwscakhhdhelhbqkyb@db.nglwscakhhdhelhbqkyb.supabase.co:5432/postgres",
    "postgresql://postgres:nglwscakhhdhelhbqkyb@db.nglwscakhhdhelhbqkyb.supabase.co:6543/postgres"
];

async function inspectTable() {
    const sql = `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'itens_projeto' ORDER BY column_name;`;

    for (const connectionString of stringsToTry) {
        console.log("Trying connection string:", connectionString.replace(/([:]).*?([@])/, "$1***$2"));
        let client = new pg.Client({ connectionString, connectionTimeoutMillis: 5000 });

        try {
            await client.connect();
            console.log("Connected successfully!");
            const res = await client.query(sql);
            console.log("Columns of itens_projeto:", res.rows);
            await client.end();
            return;
        } catch (err) {
            console.error("Connection attempt failed:", err.message);
            try { await client.end(); } catch (e) { }
        }
    }
}

inspectTable().catch(console.error);
