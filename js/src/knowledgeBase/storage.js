import { getVectorLoadablePath } from "sqlite-vss";
import { getVssLoadablePath } from "sqlite-vss";
import { load } from "sqlite-vss";
import sqlite from "sqlite3";
const { Database, OPEN_READWRITE, OPEN_CREATE } = sqlite;

export class StorageEngine {
    constructor(dbPath = 'memecoins.db') {
        this.dbPath = dbPath;
        this.dimension = 1536; // OpenAI embedding dimension
        // this.initializeDb();
    }

    async initializeDb() {
        this.db = await setupDatabase(this.dbPath);

        await this.createTables();
    }

    async createTables() {
        await dbRun(this.db, `
      CREATE TABLE IF NOT EXISTS tweets (
        id TEXT PRIMARY KEY,
        text TEXT,
        timestamp INTEGER,
        created_at TEXT,
        engagement_score REAL,
        url TEXT
      );
      `);
        await dbRun(this.db, `
      CREATE VIRTUAL TABLE IF NOT EXISTS tweets_vss USING vss0(
        vector(${this.dimension})
      );
      `);
        console.log("Tables and virtual tables created");
    }

    async resetDatabase() {
        await dbRun(this.db, 'DROP TABLE IF EXISTS tweets');
        await this.createTables();
    }

    async storeTweet(tweetInfo, embedding) {
        await this.createTables();
        // First, let's get the actual rowid after inserting into tweets
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO tweets 
            (id, text, timestamp, created_at, engagement_score, url)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING rowid
        `);

        console.log("embedding", embedding.length);
        await new Promise((resolve, reject) => {
            stmt.get(
                tweetInfo.id,
                tweetInfo.text,
                tweetInfo.timestamp,
                tweetInfo.createdAt.toISOString(),
                tweetInfo.engagementScore,
                tweetInfo.url,
                (err, row) => {
                    if (err) reject(err);
                    resolve(row.rowid);
                }
            );
        });
        const vssQuery = this.db.prepare(`
            INSERT INTO tweets_vss (rowid, vector) VALUES (?, ?)
        `);
        const result = await new Promise((resolve, reject) => {
            vssQuery.run(tweetInfo.id, JSON.stringify(embedding), (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
        return result;
    }

    getRecentTweets(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.db.all(`
      SELECT * FROM tweets 
      WHERE created_at > ? 
      ORDER BY engagement_score DESC 
      LIMIT 10
    `, [cutoff.toISOString()]);
    }

    findSimilarTweets(queryEmbedding, k = 5) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                WITH matching_tweets AS (
                    SELECT rowid, distance
                    FROM tweets_vss
                    WHERE vss_search(vector, ?)
                    ORDER BY distance ASC
                    LIMIT ?
                )
                SELECT 
                    t.id, t.text, t.timestamp, t.created_at, t.engagement_score, t.url,
                    mt.distance
                FROM tweets t
                INNER JOIN matching_tweets mt ON t.id = mt.rowid
            `);


            console.log("queryEmbedding", queryEmbedding.length);
            stmt.all(JSON.stringify(queryEmbedding), k, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    console.log("rows", rows);
                    resolve(rows);
                }
            });
        });
    }
}


// create or open the chat.sqlite database
function openDatabase(db_path) {
    return new Promise((resolve, reject) => {
        const db = new Database(db_path, OPEN_READWRITE | OPEN_CREATE, (err) => {
            if (err) reject(err)
            resolve(db)
        })
    })
}

// load a SQLite extension
async function loadExtension(db) {
    const vectorLoadablePath = getVectorLoadablePath();
    const vssLoadablePath = getVssLoadablePath();
    await new Promise((resolve, reject) => {
        db.loadExtension(vectorLoadablePath, (err) => {
            if (err) reject(err);
            resolve();
        });
    });
    await new Promise((resolve, reject) => {
        db.loadExtension(vssLoadablePath, (err) => {
            if (err) reject(err);
            resolve();
        });
    });
}

export async function setupDatabase(dbPath) {
    const db = await openDatabase(dbPath)
    try {
        await loadExtension(db)
        console.log("vector extension loaded")
    } catch (err) {
        console.error("Failed to load vector extension", err)
        throw err
    }

    // Checking to make sure the extension was loaded properly
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT vss_version() AS version",
            (err, row) => {
                if (err) {
                    console.error("Error running vss_version()", err)
                    reject(err)
                } else {
                    console.log("vss_version:", row.version) // 'v0.0.1'
                    resolve(db)
                }
            }
        )
    })
};

async function dbRun(db, query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });
}